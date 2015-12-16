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
        var game = new Phaser.Game(1600, 800, Phaser.AUTO, 'phaser');

        var gameStates = {};
        gameStates.TitleScreen = function () {
        };
        gameStates.TitleScreen.prototype = {
            create: function () {
                this.game.state.start('TestMaze');
            }
        };

        gameStates.TestMaze = function () {
            this.player = null;
            this.cursors = null;
            this.blockLayer = null;
            this.enemyGroup = null;
            this.rockGroup = null;
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
                this.game.physics.startSystem(Phaser.Physics.P2JS);

                var map = this.game.add.tilemap('testmaze');
                map.addTilesetImage('hyptosis_tile-art-batch-1');

                this.blockLayer = map.createLayer('Block Layer');
                //  TODO - darken
                this.blockLayer.tint = 0x1f1b34;
                map.createLayer('Path').tint = 0x1f1b34;
                this.blockLayer.resizeWorld();
                map.setCollision([574, 575, 208, 79, 142, 146, 177]);


                this.game.physics.p2.convertTilemap(map, this.blockLayer);
                this.game.physics.p2.setBoundsToWorld(true, true, true, true, false);

                //  TODO - physics for all objects really
                //  https://code.google.com/p/box2d-editor/
                //  http://phaser.io/examples/v2/p2-physics/load-polygon-1

                this.player = this.game.add.sprite(16, 1264, 'player');
                this.player.height = 32;
                this.player.width = 32;
                this.player.anchor.set(0.5);
                this.game.physics.p2.enable(this.player);
                this.player.body.setCircle(10);
                this.player.body.collideWorldBounds = true;
                this.player.body.mass = 10;
                this.player.body.fixedRotation = true;
                this.player.tint = 0x1f1b34;

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
                this.game.camera.follow(this.player);

                this.game.physics.p2.createCollisionGroup();
                this.enemyGroup = this.game.add.physicsGroup(Phaser.Physics.P2JS);

                this.rockGroup = this.game.add.physicsGroup(Phaser.Physics.P2JS);

                map.createFromObjects('Object Layer', 214, 'hyptosis_tile-art-batch-1', 214, true, false, this.rockGroup);
                angular.forEach(this.rockGroup.children, function (rock) {
                    rock.height = 40;
                    rock.width = 40;
                    //rock.body.debug = true;
                    rock.body.setRectangle(40, 40, 0, 0);
                    rock.body.collideWorldBounds = true;
                    rock.body.mass = 80;
                    rock.body.damping = 0.95;
                    rock.body.angularDamping = 0.85;
                    rock.body.setMaterial(rockMaterial);
                    rock.tint = 0x1f1b34;
                }, this);

                map.createFromObjects('Object Layer', 782, 'demon', 0, true, false, this.enemyGroup);
                angular.forEach(this.enemyGroup.children, function (enemy) {
                    enemy.height = 32;
                    enemy.width = 32;
                    enemy.initialX = enemy.x;
                    enemy.initialY = enemy.y;
                    enemy.minX = enemy.initialX - 64;
                    enemy.maxX = enemy.initialX + 64;
                    enemy.minY = enemy.initialY - 64;
                    enemy.maxY = enemy.initialY + 64;
                    enemy.isChasing = false;
                    //enemy.body.debug = true;
                    enemy.body.setCircle(11);
                    enemy.body.collideWorldBounds = true;
                    enemy.body.fixedRotation = true;
                    enemy.body.velocity.x = 25;
                    enemy.body.velocity.y = 25;
                    enemy.body.setZeroDamping();
                    enemy.body.setMaterial(demonMaterial);
                    enemy.tint = 0x1f1b34;
                }, this);

                this.player.body.onBeginContact.add(this.death, this);
                this.cursors = this.game.input.keyboard.createCursorKeys();
            },

            update: function () {
                this.player.body.setZeroVelocity();
                angular.forEach(this.enemyGroup.children, function (enemy) {
                    if (enemy.isChasing) {
                        //  TODO
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
                        if (Math.abs(enemy.body.velocity.x) < 5) {
                            enemy.body.velocity.x = Math.sign(enemy.body.velocity.x) * -1 * 25;
                        }
                        if (Math.abs(enemy.body.velocity.y) < 5) {
                            enemy.body.velocity.y = Math.sign(enemy.body.velocity.y) * -1 * 25;
                        }
                    }
                }, this);
                if (this.cursors.up.isDown) {
                    this.player.body.moveUp(75);
                }
                if (this.cursors.down.isDown) {
                    this.player.body.moveDown(75);
                }
                if (this.cursors.left.isDown) {
                    this.player.body.moveLeft(75);
                }
                if (this.cursors.right.isDown) {
                    this.player.body.moveRight(75);
                }
            },

            render: function () {
/*
                this.game.debug.cameraInfo(game.camera, 0, 0);
                this.game.debug.spriteInfo(this.player, 400, 0);
                this.blockLayer.debug = true;
                var count = 0;
                angular.forEach(this.enemyGroup.children, function (child, index) {
                    this.game.debug.spriteInfo(child, index * 350, 100);
                    ++count;
                }, this);
                count = 0;
                angular.forEach(this.rockGroup.children, function (child, index) {
                    this.game.debug.spriteInfo(child, index * 350, 200);
                    ++count;
                }, this);
*/
            },

            death: function (body) {
                if (
                    angular.isDefined(body) &&
                    body !== null &&
                    angular.isDefined(body.sprite) &&
                    body.sprite !== null &&
                    body.sprite.key === 'demon') {
                    this.player.kill();
                    this.game.state.start('TestMaze');
                }
            }
        };

        game.state.add('TitleScreen', gameStates.TitleScreen);
        game.state.add('TestMaze', gameStates.TestMaze);
        game.state.start('TitleScreen');
    });

