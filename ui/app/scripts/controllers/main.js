/* globals Phaser: false */
'use strict';

/**
 * @ngdoc function
 * @name uiApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the uiApp
 */
angular.module('uiApp')
    .controller('MainCtrl', function () {
        var game = new Phaser.Game(800, 400, Phaser.AUTO, 'phaser');

        var gameStates = {};
        gameStates.TitleScreen = function () {
        };
        gameStates.TitleScreen.prototype = {
            create: function () {
                this.game.state.start('TestMaze');
            }
        };

        gameStates.TestMaze = function () {
            this.PLAYER_START_X = 16;
            this.PLAYER_START_Y = 1264;
            this.PLAYER_MOVE_SPEED = 75;
            this.PLAYER_MASS = 10;

            this.ROCK_MASS = 80;

            this.DEMON_PATROL_SPEED = 25;
            this.DEMON_CHASE_SPEED = 90;
            this.DEMON_PATROL_RANGE = 64;
            this.DEMON_MAX_SIGHT = 100;
            this.DEMON_STOP_CHASING_AFTER = 10;

            this.PLAYER_LIGHT_RADIUS = 40;
            this.FINISH_LIGHT_RADIUS = 50;

            this.DEBUG = false;

            this.player = null;
            this.cursors = null;
            this.blockLayer = null;
            this.enemyGroup = null;
            this.rockGroup = null;
            this.finishGroup = null;

            this.tileHits = [];
        };
        gameStates.TestMaze.prototype = {
            //  TODO - contemplate lighting like http://www.html5gamedevs.com/topic/3052-phaser-and-2d-lighting/
            //  TODO - or http://gamemechanicexplorer.com/#lighting-1
            preload: function () {
                this.load.tilemap('testmaze', 'assets/tilemaps/testoutdoor.json', null, Phaser.Tilemap.TILED_JSON);

                this.load.spritesheet('hyptosis_tile-art-batch-1', 'images/hyptosis_tile-art-batch-1.png', 32, 32);
                this.load.image('player', 'images/HB_Dwarf05.png');
                this.load.image('demon', 'images/DemonMinorFighter.png');
            },

            create: function () {
                this.game.ending = false;

                this.game.physics.startSystem(Phaser.Physics.P2JS);

                var map = this.game.add.tilemap('testmaze');
                map.addTilesetImage('hyptosis_tile-art-batch-1');

                this.blockLayer = map.createLayer('Block Layer');
                map.createLayer('Path');
                this.blockLayer.resizeWorld();
                var tileIds = [];
                this.blockLayer.map.layers.forEach(function(layer) {
                    layer.data.forEach(function(layerRow) {
                        layerRow.forEach(function(layerCell) {
                            if(layerCell.index > 0) {
                                if(tileIds.indexOf(layerCell.index) < 0) {
                                    tileIds.push(layerCell.index);
                                }
                            }
                        });
                    });
                });
                map.setCollision(tileIds);


                this.game.physics.p2.convertTilemap(map, this.blockLayer);
                this.game.physics.p2.setBoundsToWorld(true, true, true, true, false);

                //  TODO - physics for all objects really
                //  https://code.google.com/p/box2d-editor/
                //  http://phaser.io/examples/v2/p2-physics/load-polygon-1

                this.player = this.game.add.sprite(this.PLAYER_START_X, this.PLAYER_START_Y, 'player');
                this.game.physics.p2.enable(this.player);
                this.player.body.collideWorldBounds = true;
                this.player.body.fixedRotation = true;
                this.player.body.debug = this.DEBUG;
                //  TODO - size with real image
                this.player.height = 32;
                this.player.width = 32;
                this.player.body.setCircle(10);
                this.player.body.mass = this.PLAYER_MASS;

                var playerMaterial = game.physics.p2.createMaterial('playerMaterial', this.player.body);
                var worldMaterial = game.physics.p2.createMaterial('worldMaterial');
                var rockMaterial = game.physics.p2.createMaterial('rockMaterial');
                var demonMaterial = game.physics.p2.createMaterial('demonMaterial');

                game.physics.p2.setWorldMaterial(worldMaterial, true, true, true, true);
                this.game.physics.p2.createContactMaterial(playerMaterial, worldMaterial, {
                    friction: 0.01,
                    restitution: 1,
                    stiffness: 0
                });
                this.game.physics.p2.createContactMaterial(rockMaterial, worldMaterial, {
                    friction: 0.9,
                    restitution: 0.1,
                    stiffness: 1e7,
                    relaxation: 3,
                    frictionStiffness: 1e7,
                    frictionRelaxation: 3,
                    surfaceVelocity: 0
                });
                this.game.physics.p2.createContactMaterial(demonMaterial, worldMaterial, {
                    friction: 0,
                    restitution: 1,
                    stiffness: 0,
                    relaxation: 0,
                    frictionStiffness: 0,
                    frictionRelaxation: 0,
                    surfaceVelocity: 0
                });
                this.game.physics.p2.createContactMaterial(demonMaterial, rockMaterial, {
                    friction: 1.0,
                    restitution: 0.0,
                    stiffness: 1e7,
                    relaxation: 3,
                    frictionStiffness: 1e7,
                    frictionRelaxation: 3,
                    surfaceVelocity: 0
                });

                this.finishGroup = this.game.add.physicsGroup(Phaser.Physics.P2JS);
                map.createFromObjects('Object Layer', 742, 'hyptosis_tile-art-batch-1', 742, true, false, this.finishGroup);
                map.createFromObjects('Object Layer', 772, 'hyptosis_tile-art-batch-1', 772, true, false, this.finishGroup);
                this.finishGroup.forEach(function (finish) {
                    finish.body.debug = this.DEBUG;
                    finish.height = 32;
                    finish.width = 32;
                    finish.anchor.setTo(0.5);
                    finish.body.x += finish.width / 2;
                    finish.body.y += finish.height / 2;
                    finish.body.setRectangle(32, 32, 0, 0);
                    finish.body.static = true;
                    finish.body.debug = this.DEBUG;
                }, this);

                this.rockGroup = this.game.add.physicsGroup(Phaser.Physics.P2JS);
                map.createFromObjects('Object Layer', 214, 'hyptosis_tile-art-batch-1', 214, true, false, this.rockGroup);
                this.rockGroup.forEach(function (rock) {
                    rock.body.setMaterial(rockMaterial);
                    rock.body.collideWorldBounds = true;
                    rock.body.mass = this.ROCK_MASS;
                    rock.body.damping = 0.95;
                    rock.body.angularDamping = 0.85;
                    rock.body.debug = this.DEBUG;

                    //  TODO - size with real image
                    rock.height = 40;
                    rock.width = 40;
                    rock.body.setRectangle(40, 40, 0, 0);
                }, this);

                this.enemyGroup = this.game.add.physicsGroup(Phaser.Physics.P2JS);
                map.createFromObjects('Object Layer', 782, 'demon', 0, true, false, this.enemyGroup);
                this.enemyGroup.forEach(function (enemy) {
                    enemy.height = 32;
                    enemy.width = 32;
                    enemy.body.setCircle(11);
                    enemy.initialX = enemy.x;
                    enemy.initialY = enemy.y;
                    enemy.minX = enemy.initialX - this.DEMON_PATROL_RANGE;
                    enemy.maxX = enemy.initialX + this.DEMON_PATROL_RANGE;
                    enemy.minY = enemy.initialY - this.DEMON_PATROL_RANGE;
                    enemy.maxY = enemy.initialY + this.DEMON_PATROL_RANGE;
                    enemy.isChasing = false;
                    enemy.stopChasingCount = 0;
                    enemy.body.debug = this.DEBUG;
                    enemy.body.collideWorldBounds = true;
                    enemy.body.fixedRotation = true;
                    enemy.body.velocity.x = this.DEMON_PATROL_SPEED;
                    enemy.body.velocity.y = this.DEMON_PATROL_SPEED;
                    enemy.body.setZeroDamping();
                    enemy.body.setMaterial(demonMaterial);
                }, this);

                this.player.body.onBeginContact.add(this.collisionCheck, this);

                this.cursors = this.game.input.keyboard.createCursorKeys();

                this.shadowTexture = this.game.add.bitmapData(this.game.world.width, this.game.world.height);
                this.lightSprite = this.game.add.image(this.game.camera.x, this.game.camera.y, this.shadowTexture);
                this.lightSprite.blendMode = Phaser.blendModes.MULTIPLY;

                this.game.camera.follow(this.player);
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

            update: function () {
                this.player.body.setZeroVelocity();

                if (!this.game.ending) {
                    this.enemyGroup.forEach(function (enemy) {
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
                                }, this.rockGroup.children, undefined, true).forEach(function (hit) {
                                    rocksHit.push(hit);
                                });
                            }, this);
                            enemy.isChasing = this.tileHits.length === 0 && rocksHit.length === 0;
                        }
                        if (!enemy.isChasing && wasChasing) {
                            enemy.stopChasingCount++;
                            if (enemy.stopChasingCount < this.DEMON_STOP_CHASING_AFTER) {
                                enemy.isChasing = true;
                            } else {
                                enemy.stopChasingCount = 0;
                            }
                        }
                        if (enemy.isChasing) {
                            var angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
                            enemy.body.velocity.x = Math.cos(angle) * this.DEMON_CHASE_SPEED;
                            enemy.body.velocity.y = Math.sin(angle) * this.DEMON_CHASE_SPEED;
                        } else {
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
                            if (Math.abs(enemy.body.velocity.x) < this.DEMON_PATROL_SPEED / 5) {
                                enemy.body.velocity.x = Math.sign(enemy.body.velocity.x) * -1 * this.DEMON_PATROL_SPEED;
                            }
                            if (Math.abs(enemy.body.velocity.y) < this.DEMON_PATROL_SPEED / 5) {
                                enemy.body.velocity.y = Math.sign(enemy.body.velocity.y) * -1 * this.DEMON_PATROL_SPEED;
                            }
                        }
                    }, this);
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
                } else {
                    this.enemyGroup.forEach(function (enemy) {
                        enemy.body.setZeroVelocity();
                    });
                }

                this.shadowTexture.context.fillStyle = 'rgb(10, 20, 50)';
                this.shadowTexture.context.fillRect(0, 0, this.game.world.width, this.game.world.height);

                this.drawCircleOfLight(this.player, this.PLAYER_LIGHT_RADIUS);
                this.finishGroup.forEach(function (finish) {
                    this.drawCircleOfLight(finish, this.FINISH_LIGHT_RADIUS);
                }, this);

                // This just tells the engine it should update the texture cache
                this.shadowTexture.dirty = true;

            },

            render: function () {
                if (this.DEBUG) {
                    this.game.debug.cameraInfo(game.camera, 0, 0);
                    this.game.debug.spriteInfo(this.player, 400, 0);
                    this.blockLayer.debug = true;
                    this.player.body.debug = true;
                    angular.forEach(this.enemyGroup.children, function (child, index) {
                        this.game.debug.spriteInfo(child, index * 350, 100);
                    }, this);
                    angular.forEach(this.rockGroup.children, function (child, index) {
                        this.game.debug.spriteInfo(child, index * 350, 200);
                    }, this);
                }
            },

            deathEnding: function () {
                this.game.ending = true;
                var savedRadius = this.PLAYER_LIGHT_RADIUS;
                var deathTween = this.game.add.tween(this);
                deathTween.to({PLAYER_LIGHT_RADIUS: 0}, 1000, Phaser.Easing.Power1, true);
                deathTween.onComplete.add(function () {
                    //  TODO - dying off screen doesn't reset cleanly without move
                    this.player.x = this.PLAYER_START_X;
                    this.player.y = this.PLAYER_START_Y;
                    this.player.kill();
                    this.PLAYER_LIGHT_RADIUS = savedRadius;
                    this.game.state.start('TestMaze');
                }, this);
            },

            winEnding: function () {
                this.game.ending = true;
                var savedRadius = this.PLAYER_LIGHT_RADIUS;
                var winTween = this.game.add.tween(this);
                winTween.to({PLAYER_LIGHT_RADIUS: 1000}, 1000, Phaser.Easing.Power1, true);
                winTween.onComplete.add(function () {
                    this.PLAYER_LIGHT_RADIUS = savedRadius;
                    this.game.state.start('TestMaze');
                }, this);
            },

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
            }
        };

        game.state.add('TitleScreen', gameStates.TitleScreen);
        game.state.add('TestMaze', gameStates.TestMaze);
        game.state.start('TitleScreen');
    });

