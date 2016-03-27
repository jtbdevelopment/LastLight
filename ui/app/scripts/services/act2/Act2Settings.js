/* globals Act2PatrollingEnemy: false */
/* globals Act2TownsPerson: false */
'use strict';

angular.module('uiApp').factory('Act2Settings',
    [function () {
        var act2Data = {
            PLAYER_MASS: 2,
            BONFIRE_MASS: 20000000,
            ENEMY_MASS: 1,
            PEOPLE_MASS: 2000,


            //  TODO - review all
            PLAYER_MOVE_SPEED: 75,

            ENEMY_PATROL_SPEED: 40,
            ENEMY_CHASE_SPEED: 90,
            ENEMY_PATROL_RANGE: 64,

            ENEMY_STOP_CHASING_AFTER: 10,  // loops out of sight

            FINISH_LIGHT_RADIUS: 50,

            PLAYER_LIGHT_RADIUS: 100,

            DEMON_SENSE_PLAYER_MAX_DISTANCE: 120,
            DEMON_SENSE_PEOPLE_MAX_DISTANCE: 80,

            BONFIRE_LIGHT_DISTANCE: 32 * 5,

            TORCHES_TO_LIGHT_BONFIRE: 5,

            STUN_DISTANCE: 60,
            STUN_DURATION: 2000, // in millis

            DEFAULT_PERSON_MAX_MOVE: 1,

            levelData: [
                {
                    startingX: 16,
                    startingY: 16
                },

            ]
        };

        act2Data.helpText = "Light the bonfires and protect the people!  You need at least " + act2Data.TORCHES_TO_LIGHT_BONFIRE + " torches to light a bonfire.\n  Use arrows to move.\nS to stun a nearby demon, uses a torch.\n? to show/hide this help.";
        act2Data.levels = act2Data.levelData.length;
        angular.forEach(act2Data.levelData, function (level) {
            if (angular.isUndefined(level.patrolEnemyClass)) {
                level.patrolEnemyClass = Act2PatrollingEnemy;
            }
            if (angular.isUndefined(level.townPersonClass)) {
                level.townPersonClass = Act2TownsPerson;
            }
            if (angular.isUndefined(level.townPersonMoveTiles)) {
                level.townPersonMoveTiles = act2Data.DEFAULT_PERSON_MAX_MOVE;
            }
        });

        return act2Data;
    }
    ]);
