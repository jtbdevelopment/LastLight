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
            this.enemies = [];
            this.enemyGroup = null;
        };
        gameStates.TestMaze.prototype = {
            //  TODO - contemplate lighting like http://www.html5gamedevs.com/topic/3052-phaser-and-2d-lighting/
            //  TODO - or http://gamemechanicexplorer.com/#lighting-1
            preload: function () {
                this.load.tilemap('testmaze', 'assets/tilemaps/testoutdoor.json', null, Phaser.Tilemap.TILED_JSON);

                this.load.image('hyptosis_tile-art-batch-1', 'images/hyptosis_tile-art-batch-1.png');
                this.load.image('player', 'images/HB_Dwarf05.png');
                this.load.image('demon', 'images/DemonMinorFighter.png');
            },

            create: function () {
                var map = this.game.add.tilemap('testmaze');
                map.addTilesetImage('hyptosis_tile-art-batch-1');

                this.blockLayer = map.createLayer('Block Layer');
                //  TODO - darken
                //this.blockLayer.tint = 0x00264d;
                map.createLayer('Path');//.tint = 0x00264d;
                this.blockLayer.resizeWorld();
                map.setCollision([574, 575, 208, 79, 142, 146, 177]);


                this.game.physics.startSystem(Phaser.Physics.ARCADE);

                this.player = this.game.add.sprite(16, 1264, 'player');
                this.player.height = 32;
                this.player.width = 32;
                this.player.anchor.set(0.5);
                this.game.physics.arcade.enable(this.player, Phaser.Physics.ARCADE, true);
                this.player.body.setSize(32, 32, 0, 0);
                this.player.body.collideWorldBounds = true;
                this.game.camera.follow(this.player);

                this.enemyGroup = this.game.add.group();
                this.enemyGroup.enableBody = true;

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
                    enemy.anchor.set(0.5);
                    this.game.physics.arcade.enable(enemy, Phaser.Physics.ARCADE, true);
                    enemy.body.setSize(32, 32, 0, 0);
                    enemy.body.bounce.set(1);
                    enemy.body.collideWorldBounds = true;
                    enemy.body.velocity.x = 30;
                    enemy.body.velocity.y = 30;
                    this.game.physics.arcade.moveToXY(enemy, enemy.x + 64, enemy.y - 64);
                }, this);

                this.game.camera.follow(this.player);

                this.cursors = this.game.input.keyboard.createCursorKeys();
            },

            update: function () {
                this.game.physics.arcade.collide(this.player, this.blockLayer);
                this.game.physics.arcade.collide(this.enemyGroup, this.blockLayer);
                this.game.physics.arcade.collide(this.player, this.enemyGroup, this.death, undefined, this);
                this.player.body.velocity.set(0);
                angular.forEach(this.enemies, function (enemy) {
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
                    }
                }, this);
                if (this.cursors.up.isDown) {
                    this.player.body.velocity.y = -75;
                }
                if (this.cursors.down.isDown) {
                    this.player.body.velocity.y = 75;
                }
                if (this.cursors.left.isDown) {
                    this.player.body.velocity.x = -75;
                }
                if (this.cursors.right.isDown) {
                    this.player.body.velocity.x = 75;
                }
            },

            /*
             render: function () {
             //this.game.debug.body(this.player);
             this.game.debug.bodyInfo(this.enemies[0], 32, 32);
             //this.game.debug.cameraInfo(game.camera);
             //this.blockLayer.debug = true;
             angular.forEach(this.enemies, function (enemy) {
             this.game.debug.body(enemy);
             }, this);
             },
             */

            death: function () {
                this.player.kill();
                this.game.state.start('TitleScreen');
            }
        };

        game.state.add('TitleScreen', gameStates.TitleScreen);
        game.state.add('TestMaze', gameStates.TestMaze);
        game.state.start('TitleScreen');
    });

