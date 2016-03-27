/* globals Act1PatrollingEnemy: false */
'use strict';

angular.module('uiApp').factory('Act1Settings',
    [function () {
        var act1Data = {
            PLAYER_MOVE_SPEED: 75,
            PLAYER_MASS: 10,

            MOVABLE_MASS: 200,

            ENEMY_PATROL_SPEED: 40,
            ENEMY_CHASE_SPEED: 90,
            ENEMY_PATROL_RANGE: 64,

            ENEMY_STOP_CHASING_AFTER: 10,  // loops out of sight

            FINISH_LIGHT_RADIUS: 50,

            TIME_PER_CANDLE: 60,    //  seconds

            levelData: [
                {
                    startingX: 16,
                    startingY: 1264,
                    playerHidingLightRadius: 10,
                    playerMovingLightRadius: 40,
                    helpText: "Find safety!\nUse arrows to move.\nPress C to take cover.\n? to show/hide this help."
                },
                {
                    startingX: 32,
                    startingY: 1050,
                    playerHidingLightRadius: 10,
                    playerMovingLightRadius: 40,
                    helpText: "Find safety!\nUse arrows to move.\nPress C to take cover.\n? to show/hide this help."
                },

                //  TODO - this is just a junk copy of 1st level
                {
                    startingX: 16,
                    startingY: 1264
                }

            ],
            helpText: "Take the candles to the Council before they are gone!\nUse arrows to move.\nPress C to take cover, but you cannot light a new candle while under cover.\n? to show/hide this help."
        };
        act1Data.levels = act1Data.levelData.length;
        angular.forEach(act1Data.levelData, function(level) {
            if(angular.isUndefined(level.playerMovingLightRadius)) {
                level.playerMovingLightRadius = 60;
            }
            if(angular.isUndefined(level.enemySenseMovingDistance)) {
                level.enemySenseMovingDistance = level.playerMovingLightRadius + 20;
            }
            if(angular.isUndefined(level.playerHidingLightRadius)) {
                level.playerHidingLightRadius = 20;
            }
            if(angular.isUndefined(level.enemySenseHidingDistance)) {
                level.enemySenseHidingDistance = level.playerHidingLightRadius + 20;
            }
            if(angular.isUndefined(level.patrolEnemyClass)) {
                level.patrolEnemyClass = Act1PatrollingEnemy;
            }
        });

        return act1Data;
    }
    ]
);
