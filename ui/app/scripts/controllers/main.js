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
      gameStates.TestMaze = function(game) {
          this.player = null;
          this.cursors = null;
          this.blockLayer = null;
          this.game = game;
      };
      gameStates.TestMaze.prototype = {
          preload: function () {

              this.load.tilemap('testmaze', 'assets/tilemaps/testoutdoor.json', null, Phaser.Tilemap.TILED_JSON);

              this.load.image('hyptosis_tile-art-batch-1', 'images/hyptosis_tile-art-batch-1.png');
              this.load.image('player', 'images/HB_Dwarf05.PNG' );
              this.load.image('demon', 'images/DemonMinorFighter.PNG' );
          },

          create: function() {
              var map = this.game.add.tilemap('testmaze');
              map.addTilesetImage('hyptosis_tile-art-batch-1');

              this.blockLayer = map.createLayer('Block Layer');
              this.blockLayer.tint = 0x00264d;
              map.createLayer('Path').tint = 0x00264d;
              this.blockLayer.resizeWorld();
              map.setCollisionBetween(573,575);
              map.setCollisionBetween(208,208);


              this.game.physics.startSystem(Phaser.Physics.ARCADE);

              this.player = this.game.add.sprite(16, 1264, 'player');
              this.player.height = 32;
              this.player.width = 32;
              this.player.anchor.set(0.5);
              this.game.physics.arcade.enable(this.player, Phaser.Physics.ARCADE, true);
              this.player.body.setSize(32, 32, 0, 0);
              this.game.camera.follow(this.player);
              this.cursors = this.game.input.keyboard.createCursorKeys();
          },

          update: function() {
              this.game.physics.arcade.collide(this.player, this.blockLayer);
              this.player.body.velocity.set(0);
              if(this.cursors.up.isDown) {
                  this.player.body.velocity.y = -50;
              }
              if(this.cursors.down.isDown) {
                  this.player.body.velocity.y = 50;
              }
              if(this.cursors.left.isDown) {
                  this.player.body.velocity.x = -50;
              }
              if(this.cursors.right.isDown) {
                  this.player.body.velocity.x = 50;
              }
          },

          render: function() {
              //this.game.debug.body(this.player);
              //this.game.debug.cameraInfo(game.camera);
              this.blockLayer.debug = true;
          }
      };

      game.state.add('TestMaze', gameStates.TestMaze);
      game.state.start('TestMaze');
  });

