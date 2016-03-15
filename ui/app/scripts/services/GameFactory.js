'use strict';

angular.module('uiApp').factory('GameFactory',
    ['TitleScreenState', 'Act1MazeState', 'Act3ScrollingState', 'Act4State', 'InterludeState', 'Phaser',
        function (TitleScreenState, Act1MazeState, Act3ScrollingState, Act4State, InterludeState, Phaser) {
            var game = new Phaser.Game(800, 350, Phaser.AUTO, 'phaser');

            game.state.add('TitleScreen', TitleScreenState);
            game.state.add('Interlude', InterludeState);
            game.state.add('Act1', Act1MazeState);
            game.state.add('Act3', Act3ScrollingState);
            game.state.add('Act4', Act4State);

            return game;
        }
    ]
);
