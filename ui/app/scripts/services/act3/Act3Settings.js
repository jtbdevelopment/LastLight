/* globals SimpleFiringBoss: false */
/* globals SimpleKamikaze: false */
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

            //  TODO - diff images per health?
            //  TODO - different classes with attacks?
            spawnHealthLevels: [1, 2, 5, 10],

            helpText: "Fight your way to the tower!\nUse arrows to move, space to fire.\n1-4 for different unit formations.\n? for this help.",
            levelData: [
                //  Level 1
                {
                    additionalImages: {
                        bossFire: 'images/bullet.png'
                    },
                    startingX: PLAYER_WIDTH,
                    startingY: 175 - PLAYER_HEIGHT * 1.5,
                    startingFormation: 3,

                    enemySpeed: 100,
                    enemyTurnRate: 0.5,

                    enemyWaves: [
                        {
                            waitTime: 10,
                            x: 800,
                            y: 325,
                            xSpeed: -100,
                            ySpeed: 0,
                            count: 10,
                            health: 1
                        },
                        {
                            waitTime: 0,
                            x: 800,
                            y: 0,
                            xSpeed: -100,
                            ySpeed: 0,
                            count: 10,
                            health: 1
                        },
                        {
                            waitTime: 5,
                            x: 750,
                            y: 0,
                            xSpeed: 0,
                            ySpeed: -100,
                            count: 8,
                            health: 1
                        },
                        {
                            waitTime: 0,
                            x: 710,
                            y: 350,
                            xSpeed: 0,
                            ySpeed: -100,
                            count: 8,
                            health: 1
                        },
                        {
                            waitTime: 5,
                            x: 400,
                            y: 0,
                            xSpeed: 23,
                            ySpeed: 77,
                            count: 8,
                            health: 2
                        },
                        {
                            waitTime: 0,
                            x: 450,
                            y: 350,
                            xSpeed: -23,
                            ySpeed: -77,
                            count: 8,
                            health: 2
                        },
                        {
                            waitTime: 5,
                            x: 400,
                            y: 0,
                            xSpeed: 50,
                            ySpeed: 50,
                            count: 6,
                            health: 2
                        },
                        {
                            waitTime: 0,
                            x: 450,
                            y: 350,
                            xSpeed: -50,
                            ySpeed: -50,
                            count: 6,
                            health: 2
                        },
                        {
                            waitTime: 5,
                            x: 800,
                            y: 175 - (24 + 16 / 2),
                            xSpeed: -100,
                            ySpeed: 0,
                            count: 5,
                            health: 5
                        }
                    ],
                    boss: {
                        waitTime: 5,
                        type: SimpleFiringBoss,
                        image: 'demon',
                        attackImage: 'bossFire',
                        hitsMultiple: false,
                        x: 725,
                        y: 200,
                        health: 50,
                        height: 50,
                        width: 50
                    },
                    addArrowsAtEnd: 10
                }
            ]
        };
        act3Data.levels = act3Data.levelData.length;
        act3Data.maxSpawnHealthLevel = act3Data.spawnHealthLevels[act3Data.spawnHealthLevels.length - 1];

        angular.forEach(act3Data.levelData, function(level) {
            angular.forEach(level.enemyWaves, function(wave) {
                if(angular.isUndefined(wave.type)) {
                    wave.type = SimpleKamikaze;
                }
                if(angular.isUndefined(wave.className)) {
                    wave.className = new wave.type().name;
                }
                if(angular.isUndefined(wave.image)) {
                    wave.image = 'demon';
                }
            });
        });

        return act3Data;
    }]
);
