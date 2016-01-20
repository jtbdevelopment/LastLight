'use strict';

var VERTICAL_FORMATION = 1;
var WEDGE_FORMATION = 2;
var BLOCK_FORMATION = 3;
var UP_DOWN_FORMATION = 3;
var LEFT_RIGHT_FORMATION = 4;

angular.module('uiApp').factory('Act3ScrollingState',
    ['$timeout', 'Act1Settings',
        function ($timeout, Act1Settings) {
            return {
                game: undefined,
                load: undefined,
                data: undefined,
                state: undefined,

                PLAYER_HELPERS: 5,
                PLAYER_MOVE_SPEED: 3,
                PLAYER_FIRE_FREQUENCY: 500,
                PLAYER_ARROW_VELOCITY: 300,

                //PLAYER_MASS: 10,

                //MOVABLE_MASS: 200,

                //ENEMY_PATROL_SPEED: 25,
                //ENEMY_CHASE_SPEED: 90,
                //ENEMY_PATROL_RANGE: 64,
                //ENEMY_MAX_SIGHT_PLAYER_MOVING: 100,
                //ENEMY_STOP_CHASING_AFTER: 10,

                //FINISH_LIGHT_RADIUS: 50,

                //TIME_PER_CANDLE: 60,    //  seconds

                DEBUG: false,
                tileHits: [],

                //  Phaser state functions - begin
                init: function (level, arrowsRemaining) {
                    this.LEVEL = level;
                    this.ARROWS_REMAINING = arrowsRemaining;
                    //  TODO
                    this.CURRENT_FORMATION = VERTICAL_FORMATION;
                    this.PLAYER_START_X = 0;
                    this.PLAYER_START_Y = 0;
                    this.PLAYER_HIDING_LIGHT_RADIUS = Act1Settings.playerHidingLightRadius[level];
                    this.PLAYER_MOVING_LIGHT_RADIUS = Act1Settings.playerMovingLightRadius[level];
                    this.ENEMY_MAX_SIGHT_PLAYER_HIDING = Act1Settings.enemySenseHidingDistance[level];
                    this.NEXT_FIRE_TIME = 0;
                },
                preload: function () {
                    //  Note tile asset IDs do not match because 0 represents no tile
                    //  So in tiled - a tile will be asset id 535
                    //  In json file it will be 536
                    //  When remapping images from one to another you would need to say 536 -> 535

                    //  TODO - actual art
                    //  TODO - physics for art
                    //  https://code.google.com/p/box2d-editor/
                    //  http://phaser.io/examples/v2/p2-physics/load-polygon-1
                    //  TODO - music
                    this.load.image('player', 'images/HB_Dwarf05.png');
                    this.load.image('demon', 'images/DemonMinorFighter.png');
                    this.load.image('arrow', 'images/enemy-bullet.png')
                },
                create: function () {
                    this.game.ending = false;

                    this.game.world.resize(600, 600);

                    this.game.physics.startSystem(Phaser.Physics.ARCADE);
                    this.game.physics.arcade.setBoundsToWorld(true, true, true, true, false);
                    this.createPlayerGroup();
                    this.createArrowGroup();
                    this.createEnemies();
                    /*
                     this.createMaterials();
                     this.createFinishArea(map);
                     this.createMovableObjects(map);
                     this.initializeWorldShadowing();
                     */
                    this.initializeArrowTracker();
                    this.initializeKeyboard();
                    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
                },
                update: function () {
//                    this.player.body.setZeroVelocity();

                    //  TODO - periodically replace a fallen player helper

                    if (!this.game.ending) {
                        /*
                         this.enemyGroup.forEach(function (enemy) {
                         this.checkIfEnemyWillChasePlayer(enemy);
                         if (enemy.isChasing) {
                         this.enemyChasingPlayerMovement(enemy);
                         } else {
                         this.enemyRandomlyMoving(enemy);
                         }
                         }, this);
                         */
                        this.handlePlayerMovement();
                        // this.game.physics.arcade.overlap(this.arrows, this.players, function () {
                        //     console.log('collision');
                        // }, null, this);

                        /*
                         } else {
                         this.enemyGroup.forEach(function (enemy) {
                         enemy.body.setZeroVelocity();
                         });
                         */
                    }
                    if (this.enemies.getFirstExists(true) == null || !angular.isDefined(this.enemies.getFirstExists(true))) {
                        for (var i = 0; i < 5; ++i) {
                            var enemy = this.enemies.getFirstExists(false);
                            var x = this.game.width + (enemy.width * i), y = this.game.height - enemy.height, velX = -200, velY = 0;

                            enemy.reset(x, y);
                            enemy.body.velocity.x = velX;
                            enemy.body.velocity.y = velY;
                            enemy.body.collideWorldBounds = false;
                        }
                    }
                    this.enemies.forEachExists(function (e) {
                        if (!e.body.collideWorldBounds) {
                            if (e.x >= 0 &&
                                e.x <= (this.game.width - e.width) &&
                                e.y >= 0 &&
                                e.y <= (this.game.height - e.height)
                            ) {
                                e.body.collideWorldBounds = true;
                            }

                        }
                    }, this);
                    //this.updateWorldShadowAndLights();
                },
                render: function () {
                    if (this.DEBUG) {
                        this.game.debug.cameraInfo(this.game.camera, 10, 20);
                        angular.forEach(this.players.children, function (p, index) {
                            this.game.debug.spriteInfo(p, index * 350, 100);
                            this.game.debug.body(p);
                        }, this);
                        angular.forEach(this.arrows.children, function (a, index) {
                            this.game.debug.body(a);
                        }, this);
                        angular.forEach(this.enemies.children, function (a, index) {
                            this.game.debug.body(a);
                        }, this);
//                        angular.forEach(this.enemyGroup.children, function (child, index) {
//                            this.game.debug.spriteInfo(child, index * 350, 100);
//                        }, this);
//                        angular.forEach(this.movableGroup.children, function (child, index) {
//                            this.game.debug.spriteInfo(child, index * 350, 200);
//                        }, this);
                    }
                },
                //  Phaser state functions - end

                //  Creation functions - begin
                createTileMap: function () {
                    var map = this.game.add.tilemap('act1tilemaps');
                    map.addTilesetImage('hyptosis_tile-art-batch-1');

                    map.createLayer('Path Layer ' + this.LEVEL);
                    this.blockLayer = map.createLayer('Block Layer ' + this.LEVEL);
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
                createPlayerHelper: function (x, y) {
                    var player = this.players.create(x, y, 'player');
                    player.body.collideWorldBounds = true;
                    player.body.debug = this.DEBUG;
                    // TODO - real height
                    player.height = 32;
                    player.width = 32;
                    this.playerTween.push(this.game.add.tween(player));
                    return player;
                },
                createPlayerGroup: function () {
                    this.playerTween = [];
                    this.players = this.game.add.group();
                    this.players.enableBody = true;
                    this.players.physicsBodyType = Phaser.Physics.ARCADE;
                    var x = this.PLAYER_START_X;
                    var y = this.PLAYER_START_Y;
                    for (var i = 0; i < this.PLAYER_HELPERS; ++i) {
                        this.createPlayerHelper(x, y);
                    }
                    this.game.camera.follow(this.players.children[0]);
                    //  TODO
                    //this.player.body.onBeginContact.add(this.collisionCheck, this);
                    this.switchFormation(undefined, this.CURRENT_FORMATION);
                },
                createArrowGroup: function () {
                    this.arrows = this.game.add.group();
                    this.arrows.enableBody = true;
                    this.arrows.physicsBodyType = Phaser.Physics.ARCADE;
                    this.arrows.createMultiple(50, 'arrow');
                    this.arrows.setAll('checkWorldBounds', true);
                    this.arrows.setAll('body.debug', this.DEBUG);
                    this.arrows.setAll('anchor.x', 0.5);
                    this.arrows.setAll('anchor.y', 1.0);
                    this.arrows.setAll('outOfBoundsKill', true);
                    this.arrows.setAll('height', 5);
                    this.arrows.setAll('width', 5);
                },
                createEnemies: function () {
                    this.enemies = this.game.add.group();
                    this.enemies.enableBody = true;
                    this.enemies.physicsBodyType = Phaser.Physics.ARCADE;
                    this.enemies.createMultiple(50, 'demon');
                    this.enemies.setAll('checkWorldBounds', false);
                    this.enemies.setAll('body.debug', this.DEBUG);
                    this.enemies.setAll('anchor.x', 0.5);
                    this.enemies.setAll('anchor.y', 1.0);
                    this.enemies.setAll('outOfBoundsKill', false);
                    this.enemies.setAll('height', 32);
                    this.enemies.setAll('width', 32);
                    this.enemies.setAll('body.height', 32);
                    this.enemies.setAll('body.width', 32);
                    this.enemies.setAll('body.collideWorldBounds', false);
                    this.enemies.setAll('body.bounce.x', 1);
                    this.enemies.setAll('body.bounce.y', 1);
                },
                initializeWorldShadowing: function () {
                    this.shadowTexture = this.game.add.bitmapData(this.game.world.width, this.game.world.height);
                    this.lightSprite = this.game.add.image(this.game.camera.x, this.game.camera.y, this.shadowTexture);
                    this.lightSprite.blendMode = Phaser.blendModes.MULTIPLY;
                },
                initializeKeyboard: function () {
                    this.cursors = this.game.input.keyboard.createCursorKeys();
                    this.formationKeys = [];
                    this.formationKeys.push(this.game.input.keyboard.addKey(Phaser.Keyboard.ONE));
                    this.formationKeys.push(this.game.input.keyboard.addKey(Phaser.Keyboard.TWO));
                    this.formationKeys.push(this.game.input.keyboard.addKey(Phaser.Keyboard.THREE));
                    angular.forEach(this.formationKeys, function (key, index) {
                        key.onUp.add(this.switchFormation, this, 100, index + 1);
                    }, this);
                    this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onUp.add(this.fireArrows, this);
                },
                initializeArrowTracker: function () {
                    if (this.ARROWS_REMAINING > 0) {
                        var textStyle = {
                            font: '10px Arial',
                            fill: '#FF9329',
                            align: 'left'
                        };
                        this.arrowText = this.game.add.text(0, 0, this.makeArrowText(), textStyle);
                        this.arrowText.fixedToCamera = true;
                        this.arrowText.cameraOffset.setTo(0, 0);
                    }
                },
                //  Creation functions - end

                //  Arrow related - begin
                makeArrowText: function () {
                    return 'Arrows: ' + this.ARROWS_REMAINING;
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
                    //  TODO - make a gamma slider  (10, 20,50)

                    this.shadowTexture.context.fillStyle = 'rgb(10, 20, 50)';
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
                                this.failure();
                                break;
                            case this.finishGroup:
                                this.winEnding();
                                break;
                        }
                    }
                },
                fireArrows: function () {
                    if (this.game.time.now > this.NEXT_FIRE_TIME) {
                        if (this.ARROWS_REMAINING > 0) {
                            if (angular.isDefined(this.NEXT_FIRE_TIME))
                                angular.forEach(this.players.children, function (p, index) {
                                    var arrow = this.arrows.getFirstExists(false);
                                    var x = 0, y = 0, velX = 0, velY = 0;

                                    switch (this.CURRENT_FORMATION) {
                                        case VERTICAL_FORMATION:
                                            switch (index) {
                                                case 1:
                                                case 3:
                                                    x = p.x;
                                                    y = p.y + (p.height / 2);
                                                    velX = -this.PLAYER_ARROW_VELOCITY;
                                                    break;
                                                default:
                                                    x = p.x + p.width;
                                                    y = p.y + (p.height / 2);
                                                    velX = this.PLAYER_ARROW_VELOCITY;
                                                    break;
                                            }
                                            break;
                                        case WEDGE_FORMATION:
                                            x = p.x + p.width;
                                            y = p.y + (p.height / 2);
                                            velX = this.PLAYER_ARROW_VELOCITY;
                                            break;
                                        case BLOCK_FORMATION:
                                            switch (index) {
                                                case 0:
                                                case 1:
                                                    x = p.x + (p.width / 2);
                                                    y = p.y;
                                                    velY = -this.PLAYER_ARROW_VELOCITY;
                                                    break;
                                                case 2:
                                                    x = p.x + p.width;
                                                    y = p.y + (p.height / 2);
                                                    velX = this.PLAYER_ARROW_VELOCITY;
                                                    break;
                                                case 3:
                                                case 4:
                                                    x = p.x + (p.width / 2);
                                                    y = p.y;
                                                    velY = this.PLAYER_ARROW_VELOCITY;
                                                    break;
                                            }
                                            break;
                                    }
                                    arrow.reset(x, y);
                                    arrow.body.velocity.x = velX;
                                    arrow.body.velocity.y = velY;
                                }, this);
                            this.ARROWS_REMAINING = this.ARROWS_REMAINING - 1;
                            this.NEXT_FIRE_TIME = this.game.time.now += this.PLAYER_FIRE_FREQUENCY;
                            this.arrowText.text = this.makeArrowText();
                            if (this.ARROWS_REMAINING === 0) {
                                this.failure();
                            }
                        } else {
                            // TODO
                        }
                    }
                },
                switchFormation: function (event, formation) {
                    this.CURRENT_FORMATION = formation;
                    //  ROTATE PLAYERS?
                    this.moveHelpers();
                },
                switchTakingCover: function () {
                },
                handlePlayerMovement: function () {
                    var moved = false;
                    //  This gives time for tweens to run
                    if (angular.isUndefined(this.movedLast)) {
                        this.movedLast = false;
                    }
                    if (!this.movedLast) {
                        if (this.cursors.up.isDown) {
                            this.players.children[0].y -= this.PLAYER_MOVE_SPEED;
                            moved = true;
                        }
                        if (this.cursors.down.isDown) {
                            this.players.children[0].y += this.PLAYER_MOVE_SPEED;
                            moved = true;
                        }
                        if (this.cursors.left.isDown) {
                            this.players.children[0].x -= this.PLAYER_MOVE_SPEED;
                            moved = true;
                        }
                        if (this.cursors.right.isDown) {
                            this.players.children[0].x += this.PLAYER_MOVE_SPEED;
                            moved = true;
                        }
                        if (moved) {
                            this.moveHelpers();
                            this.movedLast = true;
                        }
                    } else {
                        this.movedLast = false;
                    }
                },
                moveHelpers: function () {
                    angular.forEach(this.players.children, function (p, index) {
                        if (index == 0) {
                            var maxX = 0, maxY = 0;
                            switch (this.CURRENT_FORMATION) {
                                case VERTICAL_FORMATION:
                                    maxX = this.game.width - p.width;
                                    maxY = this.game.height - (p.height * this.players.children.length);
                                    break;
                                case BLOCK_FORMATION:
                                    maxX = this.game.width - (p.width * 3);
                                    maxY = this.game.height - (p.height * 2);
                                    break;
                                case WEDGE_FORMATION:
                                    maxX = this.game.width - (p.width * 3);
                                    maxY = this.game.height - (p.height * this.players.children.length);
                                    break;
                            }
                            if (p.x > maxX) {
                                p.x = maxX;
                            }
                            if (p.y > maxY) {
                                p.y = maxY;
                            }
                        }
                        else {
                            var x = 0, y = 0;
                            switch (this.CURRENT_FORMATION) {
                                case VERTICAL_FORMATION:
                                    x = this.players.children[0].x;
                                    y = this.players.children[0].y + (index * p.height);
                                    break;
                                case BLOCK_FORMATION:
                                    switch (index) {
                                        case 1:
                                            x = this.players.children[0].x + (2 * p.width);
                                            y = this.players.children[0].y;
                                            break;
                                        case 2:
                                            x = this.players.children[0].x + (1 * p.width);
                                            y = this.players.children[0].y + (p.height / 2);
                                            break;
                                        case 3:
                                            x = this.players.children[0].x;
                                            y = this.players.children[0].y + (p.height);
                                            break;
                                        case 4:
                                            x = this.players.children[0].x + (2 * p.width);
                                            y = this.players.children[0].y + (p.height);
                                            break;
                                    }
                                    break;
                                case WEDGE_FORMATION:
                                    switch (index) {
                                        case 1:
                                        case 2:
                                            x = this.players.children[0].x + (index * p.width);
                                            y = this.players.children[0].y + (index * p.height);
                                            break;
                                        case 3:
                                        case 4:
                                            x = this.players.children[0].x + ((4 - index) * p.width);
                                            y = this.players.children[0].y + (index * p.height);
                                            break;
                                    }
                                    break;
                            }

                            x = Math.min(x, this.game.width - p.width);
                            y = Math.min(y, this.game.height - p.height);
                            var x2 = (p.x - x) * (p.x - x);
                            var y2 = (p.y - y) * (p.y - y);
                            var distanceFactor = Math.floor(Math.sqrt(x2 + y2) / this.PLAYER_MOVE_SPEED);
                            var tween = this.playerTween[index];
                            tween.stop();
                            tween = this.game.add.tween(p);
                            this.playerTween[index] = tween;
                            tween.to({
                                x: x,
                                y: y
                            }, 8 * distanceFactor, null, true);
                        }
                    }, this)
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
                failure: function () {
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
