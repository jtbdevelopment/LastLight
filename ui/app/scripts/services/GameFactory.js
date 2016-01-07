/* globals Phaser: false */
'use strict';

angular.module('uiApp').factory('GameFactory',
    ['TitleScreenState', 'Act1MazeState', 'Act3ScrollingState',
        function (TitleScreenState, Act1MazeState, Act3ScrollingState) {
            var game = new Phaser.Game(800, 400, Phaser.AUTO, 'phaser');

            game.state.add('TitleScreen', TitleScreenState);
            game.state.add('Act1', Act1MazeState);
            game.state.add('Act3', Act3ScrollingState);

            return game;
        }
    ]
);
