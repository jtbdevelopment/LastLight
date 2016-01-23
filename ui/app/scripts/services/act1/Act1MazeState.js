'use strict';

angular.module('uiApp').factory('Act1MazeState',
    ['$timeout', 'Act1Settings',
        function ($timeout, Act1Settings) {
            return {
                game: undefined,
                load: undefined,
                data: undefined,
                state: undefined,

                PLAYER_MOVE_SPEED: 75,
                PLAYER_MASS: 10,

                MOVABLE_MASS: 200,

                ENEMY_PATROL_SPEED: 25,
                ENEMY_CHASE_SPEED: 90,
                ENEMY_PATROL_RANGE: 64,
                ENEMY_MAX_SIGHT_PLAYER_MOVING: 100,
                ENEMY_STOP_CHASING_AFTER: 10,

                FINISH_LIGHT_RADIUS: 50,

                TIME_PER_CANDLE: 60,    //  seconds

                DEBUG: false,
                tileHits: [],
                //  Phaser state functions - begin
                init: function (level, startingCandles) {
                    this.LEVEL = level;
                    this.PLAYER_START_X = Act1Settings.startingXPositions[level];
                    this.PLAYER_START_Y = Act1Settings.startingYPositions[level];
                    this.PLAYER_HIDING_LIGHT_RADIUS = Act1Settings.playerHidingLightRadius[level];
                    this.PLAYER_MOVING_LIGHT_RADIUS = Act1Settings.playerMovingLightRadius[level];
                    this.ENEMY_MAX_SIGHT_PLAYER_HIDING = Act1Settings.enemySenseHidingDistance[level];
                    this.STARTING_CANDLES = startingCandles;
                    this.CURRENT_CANDLES = this.STARTING_CANDLES;
                    this.CURRENT_TIME = this.TIME_PER_CANDLE;
                },
                preload: function () {
                    //  Note tile asset IDs do not match because 0 represents no tile
                    //  So in tiled - a tile will be asset id 535
                    //  In json file it will be 536
                    //  When remapping images from one to another you would need to say 536 -> 535
                    this.load.tilemap('act1tilemaps', 'assets/tilemaps/act1tilemaps.json', null, Phaser.Tilemap.TILED_JSON);

                    //  TODO - actual art
                    //  TODO - physics for art
                    //  https://code.google.com/p/box2d-editor/
                    //  http://phaser.io/examples/v2/p2-physics/load-polygon-1
                    //  TODO - real boundary layer ?
                    //  TODO - music
                    this.load.spritesheet('hyptosis_tile-art-batch-1', 'images/hyptosis_tile-art-batch-1.png', 32, 32);
                    this.load.image('player', 'images/HB_Dwarf05.png');
                    this.load.image('playerHiding', 'images/HB_Dwarf05Hiding.png');
                    this.load.image('demon', 'images/DemonMinorFighter.png');
                },
                create: function () {
                    this.PLAYER_LIGHT_RADIUS = this.PLAYER_MOVING_LIGHT_RADIUS;
                    this.DEMON_MAX_SIGHT = this.ENEMY_MAX_SIGHT_PLAYER_MOVING;
                    this.game.ending = false;

                    var map = this.createTileMap();

                    this.game.physics.startSystem(Phaser.Physics.P2JS);
                    this.game.physics.p2.convertTilemap(map, this.blockLayer);
                    this.game.physics.p2.setBoundsToWorld(true, true, true, true, false);
                    this.createMaterials();
                    this.createPlayer();
                    this.createFinishArea(map);
                    this.createMovableObjects(map);
                    this.createEnemies(map);
                    this.initializeKeyboard();
                    this.initializeWorldShadowing();
                    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
                    this.initializeCandleTracker();
                },
                update: function () {
                    this.player.body.setZeroVelocity();

                    if (!this.game.ending) {
                        this.enemyGroup.forEach(function (enemy) {
                            this.checkIfEnemyWillChasePlayer(enemy);
                            if (enemy.isChasing) {
                                this.enemyChasingPlayerMovement(enemy);
                            } else {
                                this.enemyRandomlyMoving(enemy);
                            }
                        }, this);
                        this.handlePlayerMovement();
                    } else {
                        this.enemyGroup.forEach(function (enemy) {
                            enemy.body.setZeroVelocity();
                        });
                    }
                    this.updateWorldShadowAndLights();
                },
                render: function () {
                    if (this.DEBUG) {
                        this.game.debug.cameraInfo(this.game.camera, 0, 0);
                        this.game.debug.spriteInfo(this.player, 400, 0);
                        angular.forEach(this.enemyGroup.children, function (child, index) {
                            this.game.debug.spriteInfo(child, index * 350, 100);
                        }, this);
                        angular.forEach(this.movableGroup.children, function (child, index) {
                            this.game.debug.spriteInfo(child, index * 350, 200);
                        }, this);
                    }
                },
                //  Phaser state functions - end

                //  Creation functions - begin
                createTileMap: function () {
                    var map = this.game.add.tilemap('act1tilemaps');
                    map.addTilesetImage('hyptosis_tile-art-batch-1');

                    map.createLayer('Path Layer ' + this.LEVEL);
                    this.blockLayer = map.createLayer('Block Layer ' + this.LEVEL);
                    this.blockLayer.debug = this.DEBUG;
                    this.blockLayer.resizeWorld();
                    var tileIds = [];
                    this.blockLayer.layer.data.forEach(function (layerRow) {
                        layerRow.forEach(function (layerCell) {
                            if (layerCell.index > 0) {
                                if (tileIds.indexOf(layerCell.index) < 0) {
                                    tileIds.push(layerCell.index);
                                }
                            }
                        });
                    });
                    tileIds = tileIds.sort();
                    map.setCollision(tileIds, true, this.blockLayer);
                    return map;
                },
                createMaterials: function () {
                    this.playerMaterial = this.game.physics.p2.createMaterial('playerMaterial');
                    this.worldMaterial = this.game.physics.p2.createMaterial('worldMaterial');
                    this.movableMaterial = this.game.physics.p2.createMaterial('movableMaterial');
                    this.enemyMaterial = this.game.physics.p2.createMaterial('enemyMaterial');

                    this.game.physics.p2.setWorldMaterial(this.worldMaterial, true, true, true, true);

                    this.game.physics.p2.createContactMaterial(this.playerMaterial, this.worldMaterial, {
                        friction: 0.01,
                        restitution: 1,
                        stiffness: 0
                    });
                    this.game.physics.p2.createContactMaterial(this.movableMaterial, this.worldMaterial, {
                        friction: 0.9,
                        restitution: 0.1,
                        stiffness: 1e7,
                        relaxation: 3,
                        frictionStiffness: 1e7,
                        frictionRelaxation: 3,
                        surfaceVelocity: 0
                    });
                    this.game.physics.p2.createContactMaterial(this.enemyMaterial, this.worldMaterial, {
                        friction: 0,
                        restitution: 1,
                        stiffness: 0,
                        relaxation: 0,
                        frictionStiffness: 0,
                        frictionRelaxation: 0,
                        surfaceVelocity: 0
                    });
                    this.game.physics.p2.createContactMaterial(this.enemyMaterial, this.movableMaterial, {
                        friction: 1.0,
                        restitution: 0.0,
                        stiffness: 1e7,
                        relaxation: 3,
                        frictionStiffness: 1e7,
                        frictionRelaxation: 3,
                        surfaceVelocity: 0
                    });
                },
                createPlayer: function () {
                    this.player = this.game.add.sprite(this.PLAYER_START_X, this.PLAYER_START_Y, 'player');
                    this.game.physics.p2.enable(this.player);
                    this.player.body.collideWorldBounds = true;
                    this.player.body.fixedRotation = true;
                    this.player.body.debug = this.DEBUG;
                    this.player.body.setMaterial(this.playerMaterial);
                    this.player.height = 32;
                    this.player.width = 32;
                    this.player.body.setCircle(10);
                    this.player.body.mass = this.PLAYER_MASS;
                    this.player.isHiding = false;
                    this.game.camera.follow(this.player);
                    this.player.body.onBeginContact.add(this.collisionCheck, this);

                },

                createFinishArea: function (map) {
                    this.finishGroup = this.game.add.physicsGroup(Phaser.Physics.P2JS);
                    map.createFromObjects('Object Layer ' + this.LEVEL, 742, 'hyptosis_tile-art-batch-1', 741, true, false, this.finishGroup);
                    map.createFromObjects('Object Layer ' + this.LEVEL, 772, 'hyptosis_tile-art-batch-1', 771, true, false, this.finishGroup);
                    this.finishGroup.forEach(function (finish) {
                        finish.body.debug = this.DEBUG;
                        finish.height = 32;
                        finish.width = 32;
                        finish.anchor.setTo(0.5);
                        finish.body.x += finish.width / 2;
                        finish.body.y += finish.height / 2;
                        finish.body.setRectangle(finish.width, finish.height, 0, 0);
                        finish.body.static = true;
                        finish.body.debug = this.DEBUG;
                    }, this);
                },

                createMovableObjects: function (map) {
                    //  TODO - custom class for logic?
                    this.movableGroup = this.game.add.physicsGroup(Phaser.Physics.P2JS);
                    map.createFromObjects('Object Layer ' + this.LEVEL, 214, 'hyptosis_tile-art-batch-1', 214, true, false, this.movableGroup);
                    this.movableGroup.forEach(function (movable) {
                        movable.body.setMaterial(this.movableMaterial);
                        movable.body.collideWorldBounds = true;
                        movable.body.mass = this.MOVABLE_MASS;
                        movable.body.damping = 0.95;
                        movable.body.angularDamping = 0.85;
                        movable.body.debug = this.DEBUG;
                        movable.height = 30;
                        movable.width = 30;
                        movable.body.x += movable.width / 2;
                        movable.body.y += movable.height / 2;
                        movable.body.setRectangle(movable.width, movable.width, 0, 0);
                    }, this);
                },

                createEnemies: function (map) {
                    this.enemyGroup = this.game.add.physicsGroup(Phaser.Physics.P2JS);
                    //  TODO - custom class for logic?
                    map.createFromObjects('Object Layer ' + this.LEVEL, 782, 'demon', 0, true, false, this.enemyGroup);
                    this.enemyGroup.forEach(function (enemy) {
                        enemy.height = 32;
                        enemy.width = 32;
                        enemy.body.setCircle(11);
                        enemy.x += 16;
                        enemy.y += 16;
                        enemy.initialX = enemy.x;
                        enemy.initialY = enemy.y;
                        enemy.minX = enemy.initialX - this.ENEMY_PATROL_RANGE;
                        enemy.maxX = enemy.initialX + this.ENEMY_PATROL_RANGE;
                        enemy.minY = enemy.initialY - this.ENEMY_PATROL_RANGE;
                        enemy.maxY = enemy.initialY + this.ENEMY_PATROL_RANGE;
                        enemy.isChasing = false;
                        enemy.stopChasingCount = 0;
                        enemy.body.debug = this.DEBUG;
                        enemy.body.collideWorldBounds = true;
                        enemy.body.fixedRotation = true;
                        enemy.body.velocity.x = this.ENEMY_PATROL_SPEED;
                        enemy.body.velocity.y = this.ENEMY_PATROL_SPEED;
                        enemy.body.setZeroDamping();
                        enemy.body.setMaterial(this.enemyMaterial);
                    }, this);
                },

                initializeWorldShadowing: function () {
                    this.shadowTexture = this.game.add.bitmapData(this.game.world.width, this.game.world.height);
                    this.lightSprite = this.game.add.image(this.game.camera.x, this.game.camera.y, this.shadowTexture);
                    this.lightSprite.blendMode = Phaser.blendModes.MULTIPLY;
                },

                initializeKeyboard: function () {
                    this.cursors = this.game.input.keyboard.createCursorKeys();
                    this.coverKey = this.game.input.keyboard.addKey(Phaser.Keyboard.C);
                    this.coverKey.onUp.add(this.switchTakingCover, this);
                },

                initializeCandleTracker: function () {
                    if (this.STARTING_CANDLES > 0) {
                        var textStyle = {
                            font: '10px Arial',
                            fill: '#FF9329',
                            align: 'left'
                        };
                        this.candleText = this.game.add.text(0, 0, this.makeCandleText(), textStyle);
                        this.candleText.fixedToCamera = true;
                        this.candleText.cameraOffset.setTo(0, 0);
                        $timeout(this.candleTimeoutHandler, 1000, true, this);
                    }
                },
                //  Creation functions - end

                //  Candle related - begin
                makeCandleText: function () {
                    return 'Candles: ' + this.CURRENT_CANDLES + ', Time: ' + this.CURRENT_TIME;
                },

                candleTimeoutHandler: function (state) {
                    if (state.game.ending) {
                        return;
                    }
                    state.CURRENT_TIME -= 1;
                    if (state.CURRENT_TIME === 0) {
                        if (state.CURRENT_CANDLES > 1) {
                            if (state.player.isHiding) {
                                state.deathEnding();
                            } else {
                                //  TODO - play match type sound?
                                state.CURRENT_CANDLES -= 1;
                                state.CURRENT_TIME = state.TIME_PER_CANDLE;
                            }
                        }
                    }
                    state.candleText.text = state.makeCandleText();
                    if (state.CURRENT_CANDLES > 0 || state.CURRENT_TIME > 0) {
                        $timeout(state.candleTimeoutHandler, 1000, true, state);
                    } else {
                        state.deathEnding();
                    }
                },

                drawCircleOfLight: function (sprite, lightRadius) {
                    var radius = lightRadius + this.game.rnd.integerInRange(1, 10);
                    var gradient = this.shadowTexture.context.createRadialGradient(
                        sprite.x, sprite.y, lightRadius * 0.25,
                        sprite.x, sprite.y, radius);
                    gradient.addColorStop(0, 'rgba(200, 200, 200, 0.5)');
                    gradient.addColorStop(1, 'rgba(200, 200, 200, 0.0)');

                    this.shadowTexture.context.beginPath();
                    this.shadowTexture.context.fillStyle = gradient;
                    this.shadowTexture.context.arc(sprite.x, sprite.y, radius, 0, Math.PI * 2, false);
                    this.shadowTexture.context.fill();
                },
                updateWorldShadowAndLights: function () {
                    this.shadowTexture.context.fillStyle = 'rgb(50, 70, 100)';
                    this.shadowTexture.context.fillRect(0, 0, this.game.world.width, this.game.world.height);

                    this.drawCircleOfLight(this.player, this.PLAYER_LIGHT_RADIUS);
                    this.finishGroup.forEach(function (finish) {
                        this.drawCircleOfLight(finish, this.FINISH_LIGHT_RADIUS);
                    }, this);

                    this.shadowTexture.dirty = true;
                },
                //  Candle related -end

                //  Player action and movement - begin
                collisionCheck: function (body) {
                    if (angular.isDefined(body) &&
                        body !== null &&
                        angular.isDefined(body.sprite) &&
                        body.sprite !== null &&
                        angular.isDefined(body.sprite.key)) {
                        switch (body.sprite.parent) {
                            case this.enemyGroup:
                                this.deathEnding();
                                break;
                            case this.finishGroup:
                                this.winEnding();
                                break;
                        }
                    }
                },
                switchTakingCover: function () {
                    this.player.isHiding = !this.player.isHiding;
                    if (this.player.isHiding) {
                        this.PLAYER_LIGHT_RADIUS = this.PLAYER_HIDING_LIGHT_RADIUS;
                        this.DEMON_MAX_SIGHT = this.ENEMY_MAX_SIGHT_PLAYER_HIDING;
                        this.player.loadTexture('playerHiding');
                    } else {
                        this.PLAYER_LIGHT_RADIUS = this.PLAYER_MOVING_LIGHT_RADIUS;
                        this.DEMON_MAX_SIGHT = this.ENEMY_MAX_SIGHT_PLAYER_MOVING;
                        this.player.loadTexture('player');
                    }
                },

                handlePlayerMovement: function () {
                    if (!this.player.isHiding) {
                        if (this.cursors.up.isDown) {
                            this.player.body.moveUp(this.PLAYER_MOVE_SPEED);
                        }
                        if (this.cursors.down.isDown) {
                            this.player.body.moveDown(this.PLAYER_MOVE_SPEED);
                        }
                        if (this.cursors.left.isDown) {
                            this.player.body.moveLeft(this.PLAYER_MOVE_SPEED);
                        }
                        if (this.cursors.right.isDown) {
                            this.player.body.moveRight(this.PLAYER_MOVE_SPEED);
                        }
                    }
                },
                //  Player action and movement - end

                //  Enemy movement - begin
                checkIfEnemyWillChasePlayer: function (enemy) {
                    //  TODO - Play sound while chasing or play sound when chase begins?
                    var ray = new Phaser.Line(enemy.x, enemy.y, this.player.x, this.player.y);
                    var wasChasing = enemy.isChasing;
                    enemy.isChasing = false;
                    if (ray.length < this.DEMON_MAX_SIGHT) {
                        if (this.DEBUG) {
                            angular.forEach(this.tileHits, function (tileHit) {
                                tileHit.debug = false;
                            });
                            this.blockLayer.dirty = this.tileHits.length > 0;
                        }
                        this.tileHits = this.blockLayer.getRayCastTiles(ray, undefined, true);
                        if (this.DEBUG) {
                            angular.forEach(this.tileHits, function (tileHit) {
                                tileHit.debug = this.DEBUG;
                            }, this);
                            this.blockLayer.dirty = this.tileHits.length > 0;
                        }

                        var rocksHit = [];
                        var lineCoordinates = ray.coordinatesOnLine(1);
                        angular.forEach(lineCoordinates, function (point) {
                            this.game.physics.p2.hitTest({
                                x: point[0],
                                y: point[1]
                            }, this.movableGroup.children, undefined, true).forEach(function (hit) {
                                rocksHit.push(hit);
                            });
                        }, this);
                        enemy.isChasing = this.tileHits.length === 0 && rocksHit.length === 0;
                    }
                    if (!enemy.isChasing && wasChasing) {
                        enemy.stopChasingCount++;
                        if (enemy.stopChasingCount < this.ENEMY_STOP_CHASING_AFTER) {
                            enemy.isChasing = true;
                        } else {
                            enemy.stopChasingCount = 0;
                        }
                    }
                },

                enemyChasingPlayerMovement: function (enemy) {
                    //  TODO - smarter pathing logic - see easystar perhaps
                    var angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
                    enemy.body.velocity.x = Math.cos(angle) * this.ENEMY_CHASE_SPEED;
                    enemy.body.velocity.y = Math.sin(angle) * this.ENEMY_CHASE_SPEED;
                },

                enemyRandomlyMoving: function (enemy) {
                    var compareX = Math.round(enemy.x * 100) / 100;
                    var compareY = Math.round(enemy.y * 100) / 100;
                    if ((compareX <= enemy.minX && enemy.body.velocity.x < 0) ||
                        (compareX >= enemy.maxX && enemy.body.velocity.x > 0)) {
                        enemy.body.velocity.x *= -1;
                    }
                    if ((compareY <= enemy.minY && enemy.body.velocity.y < 0) ||
                        (compareY >= enemy.maxY && enemy.body.velocity.y > 0)) {
                        enemy.body.velocity.y *= -1;
                    }
                    if (Math.abs(enemy.body.velocity.x) < this.ENEMY_PATROL_SPEED / 5) {
                        enemy.body.velocity.x = Math.sign(enemy.body.velocity.x) * -1 * this.ENEMY_PATROL_SPEED;
                    }
                    if (Math.abs(enemy.body.velocity.y) < this.ENEMY_PATROL_SPEED / 5) {
                        enemy.body.velocity.y = Math.sign(enemy.body.velocity.y) * -1 * this.ENEMY_PATROL_SPEED;
                    }
                },
                //  Enemy movement - end

                //  Ending related
                deathEnding: function () {
                    this.game.ending = true;
                    var deathTween = this.game.add.tween(this);
                    deathTween.to({PLAYER_LIGHT_RADIUS: 0}, 1000, Phaser.Easing.Power1, true);
                    deathTween.onComplete.add(function () {
                        //  TODO - dying off screen doesn't reset cleanly without move
                        this.player.x = this.PLAYER_START_X;
                        this.player.y = this.PLAYER_START_Y;
                        this.player.kill();
                        //  TODO - retry move on option
                        this.game.state.start(this.state.current, true, false, this.LEVEL, this.STARTING_CANDLES);
                    }, this);
                },

                winEnding: function () {
                    this.game.ending = true;
                    var winTween = this.game.add.tween(this);
                    winTween.to({PLAYER_LIGHT_RADIUS: 100}, 1000, Phaser.Easing.Power1, true);
                    winTween.onComplete.add(function () {
                        //  TODO - End of Act
                        //  TODO - interludes
                        //  TODO - retry move on option
                        this.game.state.start(this.state.current, true, false, this.LEVEL + 1, this.CURRENT_CANDLES + Act1Settings.addsCandlesAtEnd[this.LEVEL]);
                    }, this);
                }

            };
        }
    ]
);
