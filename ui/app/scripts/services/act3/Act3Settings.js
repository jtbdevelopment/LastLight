/* globals SimpleFiringBoss: false */
'use strict';

angular.module('uiApp').factory('Act3Settings',
    [function () {
        // TODO - real height/width
        var PLAYER_HEIGHT = 32;
        var PLAYER_WIDTH = 32;
        var VERTICAL_FORMATION = 1;
        var HORIZONTAL_FORMATION = 2;
        var WEDGE_FORMATION = 3;
        var BLOCK_FORMATION = 4;
        var act3Data = {
            VERTICAL_FORMATION: VERTICAL_FORMATION,
            HORIZONTAL_FORMATION: HORIZONTAL_FORMATION,
            WEDGE_FORMATION: WEDGE_FORMATION,
            BLOCK_FORMATION: BLOCK_FORMATION,

            PLAYER_HEIGHT: PLAYER_HEIGHT,
            PLAYER_WIDTH: PLAYER_WIDTH,

            baseSpawnSize: 20,
            scaleSpawnSize: 24,
            spawnHealthLevels: [1, 2, 5, 10],

            levelData: [
                {
                    startingX: PLAYER_WIDTH,
                    startingY: 175 - PLAYER_HEIGHT * 1.5,
                    startingFormation: 3,

                    enemySpeed: 100,
                    enemyTurnRate: 0.5,

                    boss: {
                        type: SimpleFiringBoss,
                        image: 'demon',
                        attack: 'bossFire1',
                        hitsMultiple: false,
                        x: 725,
                        y: 200,
                        health: 50,
                        height: 50,
                        width: 50
                    },
                    addArrowsAtEnd: 10
                }
            ],
            enemySpawns: [
                {
                    times: [0, 0, 5, 5, 5, 5, 5, 5, 5],
                    xSpawns: [800, 800, 750, 710, 400, 450, 400, 450, 800],
                    ySpawns: [325, 0, 0, 350, 0, 350, 0, 350, 175 - (24 + 16) / 2],
                    xSpeeds: [-100, -100, 0, 0, 23, -23, 50, -50, -100],
                    ySpeeds: [0, 0, 100, -100, 77, -77, 50, -50, 0],
                    spawnCount: [10, 10, 8, 8, 8, 8, 6, 6, 5],
                    health: [1, 1, 1, 1, 2, 2, 2, 2, 5]
                }
            ]
        };
        act3Data.levels = act3Data.levelData.length;
        act3Data.maxSpawnHealthLevel = act3Data.spawnHealthLevels[act3Data.spawnHealthLevels.length - 1];

        return act3Data;
    }]
);
