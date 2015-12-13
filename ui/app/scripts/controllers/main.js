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
        gameStates.TestMaze = function (game) {
            this.player = null;
            this.cursors = null;
            this.blockLayer = null;
            this.enemy = [];
            this.enemyGroup = null;
            this.game = game;
        };
        gameStates.TestMaze.prototype = {
            //  TODO - contemplate lighting like http://www.html5gamedevs.com/topic/3052-phaser-and-2d-lighting/
            //  TODO - or http://gamemechanicexplorer.com/#lighting-1
            preload: function () {

                this.load.tilemap('testmaze', 'assets/tilemaps/testoutdoor.json', null, Phaser.Tilemap.TILED_JSON);

                this.load.image('hyptosis_tile-art-batch-1', 'images/hyptosis_tile-art-batch-1.png');
                this.load.image('player', 'images/HB_Dwarf05.PNG');
                this.load.image('demon', 'images/DemonMinorFighter.PNG');
            },

            create: function () {
                var map = this.game.add.tilemap('testmaze');
                map.addTilesetImage('hyptosis_tile-art-batch-1');

                this.blockLayer = map.createLayer('Block Layer');
                this.blockLayer.tint = 0x00264d;
                map.createLayer('Path').tint = 0x00264d;
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
                var demon = this.game.add.sprite(112, 944, 'demon');
                this.enemyGroup.add(demon);
                this.enemy.push(demon);
                angular.forEach(this.enemy, function (enemy) {
                    enemy.height = 32;
                    enemy.width = 32;
                    enemy.anchor.set(0.5);
                    game.physics.arcade.enable(enemy, Phaser.Physics.ARCADE, true);
                    enemy.body.setSize(32, 32, 0, 0);
                    enemy.body.collideWorldBounds = true;
                    game.add.tween(enemy).to({y: enemy.y -64, x: enemy.x + 64}, 1000, Phaser.Easing.Linear.None, true, undefined, -1, true);
                });
                this.game.camera.follow(this.player);

                this.cursors = this.game.input.keyboard.createCursorKeys();
            },

            update: function () {
                this.game.physics.arcade.collide(this.player, this.blockLayer);
                this.game.physics.arcade.collide(this.enemyGroup, this.blockLayer);
                this.game.physics.arcade.collide(this.player, this.enemyGroup, this.death, undefined, this);
                this.player.body.velocity.set(0);
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

            render: function () {
                this.game.debug.body(this.player);
                this.game.debug.cameraInfo(game.camera);
                this.blockLayer.debug = true;
                angular.forEach(this.enemy, function (enemy) {
                    game.debug.body(enemy);
                });
            },

            death: function (sprite1, sprite2) {
                this.player.kill();
                /*
                sprite1.body.velocity.set(0);
                sprite2.body.velocity.set(0);
                sprite1.kill();
                */
                this.shutdown();
            }
        };

        game.state.add('TestMaze', gameStates.TestMaze);
        game.state.start('TestMaze');
    });

