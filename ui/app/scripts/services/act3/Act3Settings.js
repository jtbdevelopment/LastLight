/* globals SimpleFiringBoss: false */
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
                    speed: 100,
                    adjustSpeed: 0.5,
                    times: [0, 0, 5, 5, 5, 5, 5, 5, 5],
                    xSpawns: [800, 800, 750, 710, 400, 450, 400, 450, 800],
                    ySpawns: [325, 0, 0, 350, 0, 350, 0, 350, 175 - (24 + 16) / 2],
                    xSpeeds: [-100, -100, 0, 0, 23, -23, 50, -50, -100],
                    ySpeeds: [0, 0, 100, -100, 77, -77, 50, -50, 0],
                    spawnCount: [10, 10, 8, 8, 8, 8, 6, 6, 5],
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
