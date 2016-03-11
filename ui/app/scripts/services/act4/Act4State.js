/* globals Act4Ally: false */
/* globals Act4Enemy: false */
'use strict';

angular.module('uiApp').factory('Act4State',
    ['$timeout', 'Phaser', 'EasyStar', 'Act4Calculator',
        function ($timeout, Phaser, EasyStar, Act4Calculator) {
            return {
                calculator: Act4Calculator,
                game: undefined,
                load: undefined,
                data: undefined,
                state: undefined,

                DEBUG: false,
                MAX_ZOOM: 1.0,
                MIN_ZOOM: 0.50,
                ZOOM_STEP: 0.01,

                INITIAL_FOG_HEALTH: 10000,
                INITIAL_TOWER_HEALTH: 1000,

                ENEMY_SEE_DISTANCE: 100,

                ALLY_FIRE_DISTANCE: 50,
                ALLY_FIRE_RATE: 3000, //seconds in millis
                ALLY_SEE_DISTANCE: 100,
                ALLY_ARROW_SPEED: 45,
                ALLY_ARROW_DISTANCE: 75,

                FIND_PATH_FREQUENCY: 2000, // seconds in millis

                TOTAL_TIME: 20, // minutes

                SUN_HIT_PRECISION: 5,

                //  Phaser state functions - begin
                init: function () {
                    //  TODO - checkpoint
                    //  TODO - minimap
                },
                preload: function () {
                    //  Note tile asset IDs do not match because 0 represents no tile
                    //  So in tiled - a tile will be asset id 535
                    //  In json file it will be 536
                    //  When remapping images from one to another you would need to say 536 -> 535
                    this.load.tilemap('tilemap', 'assets/tilemaps/act4.json', null, Phaser.Tilemap.TILED_JSON);

                    //  TODO - actual art
                    //  TODO - physics for art
                    //  https://code.google.com/p/box2d-editor/
                    //  http://phaser.io/examples/v2/p2-physics/load-polygon-1
                    //  TODO - real boundary layer ?
                    //  TODO - music
                    this.load.spritesheet('hyptosis_tile-art-batch-1', 'images/hyptosis_tile-art-batch-1.png', 32, 32);
                    this.load.spritesheet('hyptosis_tile-art-batch-2', 'images/hyptosis_tile-art-batch-2.png', 32, 32);
                    this.load.spritesheet('hyptosis_tile-art-batch-3', 'images/hyptosis_tile-art-batch-3.png', 32, 32);
                    this.load.image('lens-center', 'images/LightOrb.png');
                    this.load.image('sun', 'images/LightStar.png');
                    this.load.image('ally', 'images/act4ally.png');
                    this.load.image('enemy', 'images/act4enemy.png');
                    this.load.image('arrow', 'images/enemy-bullet.png');
                },
                create: function () {
                    this.tileHits = [];
                    this.game.ending = false;
                    this.scale = this.MIN_ZOOM;
                    this.lastScale = 0;
                    this.fogHealth = this.INITIAL_FOG_HEALTH;
                    this.fogHealthPercent = 1.0;
                    this.towerHealth = this.INITIAL_TOWER_HEALTH;
                    this.towerHealthPercent = 1.0;
                    this.sunPositionPercent = 1.0;

                    this.createTileMap();

                    this.easyStar = new EasyStar.js();
                    var easyGrid = [];
                    angular.forEach(this.blockLayer.layer.data, function (row) {
                        var easyRow = [];
                        angular.forEach(row, function (cell) {
                            easyRow.push(cell.index);
                        });
                        easyGrid.push(easyRow);
                    });
                    this.easyStar.setGrid(easyGrid);
                    this.easyStar.setAcceptableTiles([-1]);
                    this.easyStar.enableDiagonals();
                    this.easyStar.enableSync();

                    this.game.physics.startSystem(Phaser.Physics.ARCADE);
                    this.game.physics.arcade.setBoundsToWorld();
                    this.createSun();
                    this.createAllies();
                    this.createEnemies();
                    this.createPlayer();
                    this.initializeKeyboard();
                    this.initializeWorldShadowing();
                    this.initializeInfoText();
                    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
                    this.game.camera.follow(this.focusFire);
                    $timeout(this.addEnemies, 5000, false, this);
                },

                clearTileHitDisplay: function () {
                    if (this.state.DEBUG) {
                        angular.forEach(this.tileHits, function (tileHit) {
                            tileHit.debug = false;
                        });
                        this.blockLayer.dirty = this.tileHits.length > 0;
                    }
                    this.tileHits = [];
                },
                addTileHitsToDisplay: function (moreTileHits) {
                    this.tileHits = this.tileHits.concat(moreTileHits);
                },
                showTileHitsDisplay: function () {
                    if (this.DEBUG) {
                        angular.forEach(this.tileHits, function (tileHit) {
                            tileHit.debug = this.DEBUG;
                        }, this);
                        this.blockLayer.dirty = this.tileHits.length > 0;
                    }
                },

                update: function () {
                    //this.player.body.setZeroVelocity();
                    this.clearTileHitDisplay();
                    if (!this.game.ending) {
                        this.handleZoomChange();
                        this.handlePlayerMovement();
                        this.game.physics.arcade.overlap(this.arrowsGroup, this.enemyGroup, this.arrowHitsEnemy, null, this);
                        this.game.physics.arcade.overlap(this.alliesGroup, this.enemyGroup, this.enemyHitsAlly, null, this);
                        this.game.physics.arcade.overlap(this.alliesGroup, this.playerGroup, this.lensHitsAlly, null, this);
                        this.game.physics.arcade.overlap(this.enemyGroup, this.playerGroup, this.lensHitsEnemy, null, this);
                        this.game.physics.arcade.overlap(this.playerGroup, this.sunGroup, this.lensHitsSun, null, this);
                        this.fogHealthPercent = this.fogHealth / this.INITIAL_FOG_HEALTH;
                        this.fogHealthText.text = this.makeFogHealthText();
                        this.sunPositionPercent = this.sun.x / this.game.world.width;
                        this.sunPositionText.text = this.makeDaylightText();
                        this.enemyGroup.forEachAlive(function (enemy) {
                            try {
                                enemy.updateFunction();
                            } catch (ex) {
                                console.log(ex);
                            }
                        });
                        this.alliesGroup.forEachAlive(function (ally) {
                            try {
                                ally.updateFunction();
                            } catch (ex) {
                                console.log(ex);
                            }
                        });
                        this.arrowsGroup.forEachAlive(function (arrow) {
                            var arrowDistance = this.calculator.calcDistancePoints(arrow.initialX, arrow.initialY, arrow.x, arrow.y);
                            if (arrowDistance.distance >= this.ALLY_ARROW_DISTANCE) {
                                arrow.kill();
                            }
                        }, this);
                        this.easyStar.calculate();
                        this.towerHealthPercent = this.towerHealth / this.INITIAL_TOWER_HEALTH;
                        this.towerHealthText.text = this.makeTowerHealthText();
                        this.alliesLiving = this.alliesGroup.countLiving();
                        this.alliesText.text = this.makeAlliesText();
                        this.updateWorldShadowAndLights();
                        this.showTileHitsDisplay();
                        this.game.physics.arcade.collide(this.alliesGroup, this.blockLayer);
                        this.game.physics.arcade.collide(this.arrowsGroup, this.blockLayer, this.arrowHitsBarrier);
                        this.game.physics.arcade.collide(this.enemyGroup, this.blockLayer);
                    } else {
//                        this.enemyGroup.forEach(function (enemy) {
//                            enemy.body.setZeroVelocity();
//                        });
                    }
                },
                render: function () {
                    if (this.DEBUG) {
                        this.game.debug.cameraInfo(this.game.camera, 0, 20);
                        this.game.debug.spriteInfo(this.focusFire, 400, 20);
                        this.game.debug.body(this.sun);
                        angular.forEach(this.playerGroup.children, function (p) {
                            this.game.debug.body(p);
                        }, this);
                        angular.forEach(this.sunGroup.children, function (p) {
                            this.game.debug.body(p);
                        }, this);
                        angular.forEach(this.enemyGroup.children, function (p) {
                            this.game.debug.body(p);
                        }, this);
                        angular.forEach(this.arrowsGroup.children, function (p) {
                            this.game.debug.body(p);
                        }, this);
                        angular.forEach(this.alliesGroup.children, function (p) {
                            this.game.debug.body(p);
                        }, this);
                    }
                },
                //  Phaser state functions - end

                //  Creation functions - begin
                createTileMap: function () {
                    this.map = this.game.add.tilemap('tilemap');
                    this.map.addTilesetImage('hyptosis_tile-art-batch-1');
                    this.map.addTilesetImage('hyptosis_tile-art-batch-2');
                    this.map.addTilesetImage('hyptosis_tile-art-batch-3');

                    this.pathLayer = this.map.createLayer('Path Layer');
                    this.blockLayer = this.map.createLayer('Block Layer');
                    this.blockLayer.debug = this.DEBUG;
                    this.blockLayer.resizeWorld();
                    this.collisionTileIds = [];
                    this.blockLayer.layer.data.forEach(function (layerRow) {
                        layerRow.forEach(function (layerCell) {
                            if (layerCell.index > 0) {
                                if (this.collisionTileIds.indexOf(layerCell.index) < 0) {
                                    this.collisionTileIds.push(layerCell.index);
                                }
                            }
                        }, this);
                    }, this);
                    this.collisionTileIds = this.collisionTileIds.sort();
                    this.map.setCollision(this.collisionTileIds, true, this.blockLayer, false);
                },
                createAllies: function () {
                    this.arrowsGroup = this.game.add.physicsGroup();
                    this.arrowsGroup.createMultiple(300, 'arrow');
                    this.arrowsGroup.setAll('checkWorldBounds', true);
                    this.arrowsGroup.setAll('body.debug', this.DEBUG);
                    this.arrowsGroup.setAll('anchor.x', 0.0);
                    this.arrowsGroup.setAll('anchor.y', 0.0);
                    this.arrowsGroup.setAll('outOfBoundsKill', true);
                    this.arrowsGroup.setAll('body.collideWorldBounds', true);
                    this.arrowsGroup.setAll('body.bounce.x', 1);
                    this.arrowsGroup.setAll('body.bounce.y', 1);
                    this.arrowsGroup.setAll('height', 3);
                    this.arrowsGroup.setAll('width', 3);
                    this.arrowsGroup.setAll('body.height', 3);
                    this.arrowsGroup.setAll('body.width', 3);

                    this.alliesGroup = this.game.add.physicsGroup();
                    this.alliesGroup.classType = Act4Ally;
                    this.alliesGroup.createMultiple(200, 'ally');
                    this.alliesGroup.setAll('state', this);
                    this.alliesGroup.setAll('checkWorldBounds', true);
                    this.alliesGroup.setAll('body.debug', this.DEBUG);
                    this.alliesGroup.setAll('anchor.x', 0.0);
                    this.alliesGroup.setAll('anchor.y', 0.0);
                    this.alliesGroup.setAll('outOfBoundsKill', false);
                    this.alliesGroup.setAll('body.collideWorldBounds', true);
                    this.alliesGroup.setAll('body.bounce.x', 1);
                    this.alliesGroup.setAll('body.bounce.y', 1);
                    this.alliesGroup.setAll('height', 15);
                    this.alliesGroup.setAll('width', 15);
                    this.alliesGroup.setAll('body.height', 15);
                    this.alliesGroup.setAll('body.width', 15);
                    for (var i = 0; i < 8; ++i) {
                        var baseX = (360 + 720 * i) - (32 * 3);
                        var baseY = 565;
                        switch (i) {
                            case 0:
                                baseX -= 30;
                                break;
                            case 1:
                            case 6:
                                baseY += 70;
                                break;
                            case 2:
                                baseY = 285;
                                break;
                            case 3:
                                baseX += 15;
                                break;
                            case 4:
                                baseY = 265;
                                baseX -= 10;
                                break;
                            case 7:
                                baseY = 390;
                                baseX -= 20;
                                break;
                        }
                        for (var j = 0; j < 20; ++j) {
                            var x = baseX + this.game.rnd.integerInRange(0, 42 * 3);
                            var y = baseY + this.game.rnd.integerInRange(0, 42 * 3);
                            var ally = this.alliesGroup.getFirstExists(false);
                            ally.reset(x, y);
                        }
                    }
                },
                createPlayer: function () {
                    this.playerGroup = this.game.add.physicsGroup();
                    this.focusFire = this.playerGroup.create(this.game.world.width - 300, 20, 'lens-center');
                    this.focusFire.checkWorldBounds = true;
                    this.focusFire.outOfBoundsKill = false;
                    this.focusFire.body.collideWorldBounds = true;
                    this.focusFire.body.bounce.x = 0;
                    this.focusFire.body.bounce.y = 0;
                    this.focusFire.height = 16;
                    this.focusFire.width = 16;
                    this.focusFire.body.width = this.focusFire.width;
                    this.focusFire.body.height = this.focusFire.height;
                    this.focusFire.anchor.x = 0;
                    this.focusFire.anchor.y = 0;
                    this.focusFire.debug = this.DEBUG;
                    this.playerGroup.add(this.focusFire);
                },
                createSun: function () {
                    this.sunGroup = this.game.add.physicsGroup();
                    this.sun = this.sunGroup.create(this.game.world.width, 230, 'sun');
                    this.sun.height = 24;
                    this.sun.width = 24;
                    this.sun.body.width = this.sun.width;
                    this.sun.body.height = this.sun.height;
                    this.sun.anchor.x = 0;
                    this.sun.anchor.y = 0;
                    this.sun.debug = this.DEBUG;
                    this.sunGroup.add(this.sun);
                    var totalTime = this.TOTAL_TIME * 60 * 1000;
                    this.sunTweens = [];
                    this.sunTweens.push(this.game.add.tween(this.sun).to({x: 0 - this.sun.width}, totalTime, Phaser.Easing.Linear.None, false));
                    this.sunTweens.push(this.game.add.tween(this.sun).to({y: 10}, totalTime / 2, Phaser.Easing.Quartic.Out, false));
                    this.sunTweens.push(this.game.add.tween(this.sun).to({y: 230}, totalTime / 2, Phaser.Easing.Quartic.In, false));
                    this.sunTweens[1].chain(this.sunTweens[2]);
                    this.sunTweens[0].start();
                    this.sunTweens[1].start();
                },

                createEnemies: function () {
                    this.enemyGroup = this.game.add.physicsGroup(Phaser.Physics.ARCADE);
                    this.enemyGroup.classType = Act4Enemy;
                    this.enemyGroup.createMultiple(400, 'enemy');
                    this.enemyGroup.setAll('state', this);
                    this.enemyGroup.setAll('checkWorldBounds', true);
                    this.enemyGroup.setAll('body.debug', this.DEBUG);
                    this.enemyGroup.setAll('anchor.x', 0.0);
                    this.enemyGroup.setAll('anchor.y', 0.0);
                    this.enemyGroup.setAll('outOfBoundsKill', true);
                    this.enemyGroup.setAll('body.collideWorldBounds', true);
                    this.enemyGroup.setAll('body.bounce.x', 1);
                    this.enemyGroup.setAll('body.bounce.y', 1);
                    this.enemyGroup.setAll('height', 15);
                    this.enemyGroup.setAll('width', 15);
                    this.enemyGroup.setAll('body.height', 15);
                    this.enemyGroup.setAll('body.width', 15);
                },
                addEnemies: function (state) {
                    var enemy = state.enemyGroup.getFirstExists(false);
                    var y = 270;
                    var x;
                    var looking = true;
                    while (looking) {
                        x = state.game.rnd.integerInRange(1, state.game.world.width) - 1;
                        var tiles = state.blockLayer.getTiles(
                            x * state.scale,
                            y * state.scale,
                            enemy.width * state.scale,
                            enemy.height * state.scale, false, false);

                        if (angular.isDefined(tiles) && tiles.length >= 0) {
                            looking = angular.isDefined(tiles.find(function (e) {
                                return e.index !== -1;
                            }));
                        }
                    }
                    enemy.reset(x, y);
                    enemy.activateFunction(2, 2, 15);
                    console.log('active health ' + enemy.health);
                    $timeout(state.addEnemies, 100, false, state);
                },

                initializeWorldShadowing: function () {
                    this.shadowTexture = this.game.add.bitmapData(this.game.world.width, this.game.world.height);
                    this.lightSprite = this.game.add.image(this.game.camera.x, this.game.camera.y, this.shadowTexture);
                    this.lightSprite.blendMode = Phaser.blendModes.MULTIPLY;
                },

                initializeKeyboard: function () {
                    this.cursors = this.game.input.keyboard.createCursorKeys();
                    this.altKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ALT);
                    this.zoomIn = this.game.input.keyboard.addKey(Phaser.Keyboard.X);
                    this.zoomOut = this.game.input.keyboard.addKey(Phaser.Keyboard.Z);
                },

                initializeInfoText: function () {
                    var textStyle = {
                        font: '12px Arial',
                        fill: '#FF9329',
                        align: 'left'
                    };
                    this.fogHealthText = this.game.add.text(0, 0, '', textStyle);
                    this.fogHealthText.fixedToCamera = true;
                    this.fogHealthText.cameraOffset.setTo(3, 0);

                    this.sunPositionText = this.game.add.text(0, 0, '', textStyle);
                    this.sunPositionText.fixedToCamera = true;
                    this.sunPositionText.cameraOffset.setTo(3, 15);

                    this.towerHealthText = this.game.add.text(0, 0, '', textStyle);
                    this.towerHealthText.fixedToCamera = true;
                    this.towerHealthText.cameraOffset.setTo(3, 30);

                    this.alliesText = this.game.add.text(0, 0, '', textStyle);
                    this.alliesText.fixedToCamera = true;
                    this.alliesText.cameraOffset.setTo(3, 45);
                },
                //  Creation functions - end

                //  Light related - begin
                makeFogHealthText: function () {
                    return 'Fog: ' + Math.floor(this.fogHealthPercent * 100) + '%';
                },

                makeDaylightText: function () {
                    return 'Daylight Remaining: ' + Math.floor(this.sunPositionPercent * 100) + '%';
                },

                makeTowerHealthText: function () {
                    return 'Tower: ' + Math.floor(this.towerHealthPercent * 100) + '%';
                },

                makeAlliesText: function () {
                    return 'Allies: ' + this.alliesLiving;
                },

                drawCircleOfLight: function (sprite, lightRadius, maxBrightness) {
                    var radius = lightRadius + this.game.rnd.integerInRange(1, 10);
                    var x = (sprite.x + (sprite.width / 2)) * this.scale;
                    var y = (sprite.y + (sprite.height / 2)) * this.scale;
                    var gradient = this.shadowTexture.context.createRadialGradient(
                        x, y, lightRadius * 0.25,
                        x, y, radius);
                    gradient.addColorStop(0, 'rgba(255, 255, 255, ' + maxBrightness + ')');
                    gradient.addColorStop(1, 'rgba(255, 255, 200, 0.0)');

                    this.shadowTexture.context.beginPath();
                    this.shadowTexture.context.fillStyle = gradient;
                    this.shadowTexture.context.arc(x, y, radius, 0, Math.PI * 2, false);
                    this.shadowTexture.context.fill();
                },

                updateWorldShadowAndLights: function () {
                    //  TODO - make this scale as we go
                    var darknessScale = Math.floor(255 - (175 * this.fogHealthPercent));
                    this.shadowTexture.context.fillStyle = 'rgb(' + darknessScale +
                        ', ' + darknessScale +
                        ', ' + darknessScale +
                        ')';
                    this.shadowTexture.context.fillRect(0, 0, this.game.world.width, this.game.world.height);

                    this.drawCircleOfLight(this.focusFire, this.focusFire.width * 2, 1.0);
                    this.drawCircleOfLight(this.sun, 1, Math.min(0.1, 1 - this.fogHealthPercent));

                    this.shadowTexture.dirty = true;
                },
                //  Light related - end

                //  Allies and Enemies - begin
                enemyHitsBarrier: function (enemy, barrier) {
                    console.log(JSON.stringify(barrier));
                },
                arrowHitsBarrier: function (arrow) {
                    arrow.kill();
                },
                arrowHitsEnemy: function (arrow, enemy) {
                    arrow.kill();
                    enemy.health -= 1;
                    console.log(enemy.health);
                    if (enemy.health <= 0) {
                        enemy.kill();
                    }
                    //  TODO - record
                },

                enemyHitsAlly: function (ally) {
                    ally.kill();
                    //  TODO - record
                },

                lensHitsEnemy: function (enemy) {
                    enemy.health -= 5;
                    if (enemy.health <= 0) {
                        enemy.kill();
                    }
                    //  TODO - track
                },

                lensHitsAlly: function (ally) {
                    ally.kill();
                    //  TODO - track
                },

                lensHitsSun: function () {
                    var distance = this.calculator.calcDistanceSprites(this.focusFire, this.sun);
                    if (distance.distance < this.SUN_HIT_PRECISION) {
                        this.fogHealth -= 1;
                        if (this.fogHealth === 0) {
                            this.winEnding();
                        }
                    }
                },

                //  Allies and Enemies - end

                //  Player action and movement - begin
                handleZoomChange: function () {
                    if (this.zoomIn.isDown) {
                        this.scale += this.ZOOM_STEP;
                    }
                    if (this.zoomOut.isDown) {
                        this.scale -= this.ZOOM_STEP;
                    }
                    this.scale = Math.min(Math.max(this.MIN_ZOOM, this.scale), this.MAX_ZOOM);
                    if (this.scale !== this.lastScale) {
                        this.blockLayer.setScale(this.scale, this.scale);
                        this.pathLayer.setScale(this.scale, this.scale);
                        this.playerGroup.scale.setTo(this.scale);
                        this.playerGroup.forEach(function (e) {
                            e.body.width = e.width * this.scale;
                            e.body.height = e.height * this.scale;
                        }, this);
                        this.alliesGroup.scale.setTo(this.scale);
                        this.alliesGroup.forEach(function (e) {
                            e.body.width = e.width * this.scale;
                            e.body.height = e.height * this.scale;
                        }, this);
                        this.enemyGroup.scale.setTo(this.scale);
                        this.enemyGroup.forEach(function (e) {
                            e.body.width = e.width * this.scale;
                            e.body.height = e.height * this.scale;
                        }, this);
                        this.arrowsGroup.scale.setTo(this.scale);
                        this.arrowsGroup.forEach(function (e) {
                            e.body.width = e.width * this.scale;
                            e.body.height = e.height * this.scale;
                        }, this);
                        this.sunGroup.scale.setTo(this.scale);
                        this.sunGroup.forEach(function (e) {
                            e.body.width = e.width * this.scale;
                            e.body.height = e.height * this.scale;
                        }, this);
                        this.blockLayer.resize(this.game.scale.width / this.scale, this.game.scale.height / this.scale);
                        this.pathLayer.resize(this.game.scale.width / this.scale, this.game.scale.height / this.scale);
                        this.game.camera.bounds.width = this.game.world.width * this.blockLayer.scale.x;
                        this.game.camera.bounds.height = this.game.world.height * this.blockLayer.scale.y;
                        this.game.physics.arcade.setBoundsToWorld();
                        this.lastScale = this.scale;
                    }
                },

                handlePlayerMovement: function () {
                    var move;
                    if (!this.altKey.isDown) {
                        move = 50 * this.playerGroup.scale.x;
                        this.game.camera.unfollow();
                        if (this.cursors.up.isDown) {
                            this.game.camera.y -= move;
                        }
                        if (this.cursors.down.isDown) {
                            this.game.camera.y += move;
                        }
                        if (this.cursors.left.isDown) {
                            this.game.camera.x -= move;
                        }
                        if (this.cursors.right.isDown) {
                            this.game.camera.x += move;
                        }
                        this.focusFire.body.velocity.y = 0;
                        this.focusFire.body.velocity.x = 0;
                    } else {
                        this.game.camera.follow(this.focusFire);
                        move = 2 * this.scale;
                        var max = move * 200;
                        if (this.cursors.up.isDown) {
                            this.focusFire.body.velocity.y = Math.min(0, this.focusFire.body.velocity.y);
                            this.focusFire.body.velocity.y -= move;
                            this.focusFire.body.velocity.y = Math.max(-max, this.focusFire.body.velocity.y);
                        }
                        if (this.cursors.down.isDown) {
                            this.focusFire.body.velocity.y = Math.max(0, this.focusFire.body.velocity.y);
                            this.focusFire.body.velocity.y += move;
                            this.focusFire.body.velocity.y = Math.min(max, this.focusFire.body.velocity.y);
                        }
                        if (this.cursors.left.isDown) {
                            this.focusFire.body.velocity.x = Math.min(0, this.focusFire.body.velocity.x);
                            this.focusFire.body.velocity.x -= move;
                            this.focusFire.body.velocity.x = Math.max(-max, this.focusFire.body.velocity.x);
                        }
                        if (this.cursors.right.isDown) {
                            this.focusFire.body.velocity.x = Math.max(0, this.focusFire.body.velocity.x);
                            this.focusFire.body.velocity.x += move;
                            this.focusFire.body.velocity.x = Math.min(max, this.focusFire.body.velocity.x);
                        }
                    }
                },
                //  Player action and movement - end

                //  Ending related
                deathEnding: function () {
                    this.game.ending = true;
                    var deathTween = this.game.add.tween(this);
                    deathTween.to({playerLightRadius: 0}, 1000, Phaser.Easing.Power1, true);
                    deathTween.onComplete.add(function () {
                        //  TODO - dying off screen doesn't reset cleanly without move
                        this.player.x = this.levelData.startingX;
                        this.player.y = this.levelData.startingY;
                        this.player.kill();
                        //  TODO - retry move on option
                        this.game.state.start(this.state.current, true, false, this.level, this.startingCandles);
                    }, this);
                },

                winEnding: function () {
                    this.game.ending = true;
                    var winTween = this.game.add.tween(this);
                    winTween.to({playerLightRadius: 100}, 1000, Phaser.Easing.Power1, true);
                    winTween.onComplete.add(function () {
                        //  TODO - End of Act
                        //  TODO - interludes
                        //  TODO - retry move on option
                        this.game.state.start(this.state.current, true, false, this.level + 1, this.currentCandles + this.levelData.addsCandlesAtEnd);
                    }, this);
                }

            };
        }
    ]
)
;
