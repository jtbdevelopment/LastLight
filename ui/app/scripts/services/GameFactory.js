/* globals Phaser: false */
'use strict';

angular.module('uiApp').factory('GameFactory',
    ['TitleScreenState', 'Act1MazeState', function (TitleScreenState, Act1MazeState) {
        var game = new Phaser.Game(800, 400, Phaser.AUTO, 'phaser');

        game.state.add('TitleScreen', TitleScreenState);
        game.state.add('Act1', Act1MazeState);

        return game;
    }
    ]
);
