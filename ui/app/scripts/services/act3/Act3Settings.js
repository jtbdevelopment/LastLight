'use strict';

angular.module('uiApp').factory('Act3Settings',
    [function () {
        var act3Data = {
            healthLevels: [1, 2, 5, 10],
            startingXPositions: [],
            startingYPositions: [],
            addsArrowsAtEnd: [],
            enemySpawns: [
                {
                    speed: 130,
                    times: [0, 0, 5, 5, 5, 5, 5, 5, 5],
                    xSpawns: [800, 0, 750, 710, 400, 450, 400, 450, 800],
                    ySpawns: [325, 0, 0, 350, 0, 350, 0, 350, 175 - (24 + 16) / 2],
                    xVels: [-130, 130, 0, 0, 30, -30, 65, -65, -130],
                    yVels: [0, 0, 130, -130, 100, -100, 65, -65, 0],
                    spawnCount: [8, 8, 8, 8, 8, 8, 8, 8, 8],
                    health: [1, 1, 1, 1, 2, 2, 2, 2, 5],
                    boss: {
                        type: SimpleFiringBoss,
                        x: 725,
                        y: 200,
                        health: 50,
                        height: 50,
                        width: 50
                    }
                }
            ]
        };
        act3Data.levels = 3;
        for (var i = 0; i < act3Data.levels; ++i) {
            act3Data.startingXPositions.push(32);
            act3Data.startingYPositions.push(175 - 32 - 16);
            act3Data.addsArrowsAtEnd.push(0);
        }

        return act3Data;
    }]
);
