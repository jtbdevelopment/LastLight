'use strict';

angular.module('uiApp').factory('GameFactory',
    ['TitleScreenState', 'Act1MazeState', 'Act2MazeState', 'Act3ScrollingState', 'Act4State', 'InterludeState', 'Phaser',
        function (TitleScreenState, Act1MazeState, Act2MazeState, Act3ScrollingState, Act4State, InterludeState, Phaser) {
            var HEIGHT = 350;
            var WIDTH = 800;
            var game = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, 'phaser');
            game.resetDefaultSize = function () {
                game.world.setBounds(0, 0, WIDTH, HEIGHT);
            };

            game.state.add('TitleScreen', TitleScreenState);
            game.state.add('Interlude', InterludeState);
            game.state.add('Act1', Act1MazeState);
            game.state.add('Act2', Act2MazeState);
            game.state.add('Act3', Act3ScrollingState);
            game.state.add('Act4', Act4State);

            return game;
        }
    ]
);
