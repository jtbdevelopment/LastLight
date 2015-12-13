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
      var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser');

      var gameStates = {};
      gameStates.TestMaze = function(game) {

      };
      gameStates.TestMaze.prototype = {
          preload: function () {

              this.load.path = 'assets/';

              this.load.images([ 'hyptosis_tile-art-batch-1' ]);

              this.load.tilemap('testmaze', 'tilemaps/testoutdoor.json', null, Phaser.Tilemap.TILED_JSON);
          },
          create: function() {
              var map = game.add.tilemap('testmaze');
              map.addTilesetImage('hyptosis_tile-art-batch-1');
              map.createLayer('Path');
              map.createLayer('Block Layer');
          }
      };
      game.state.add('TestMaze', gameStates.TestMaze);
      game.state.start('TestMaze');
  });

