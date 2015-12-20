'use strict';

angular.module('uiApp').factory('Act1Settings',
    [function () {
        var act1Data = {
            startingXPositions: [16],
            startingYPositions: [1264],
            playerHidingLightRadius: [10],
            playerMovingLightRadius: [40],
            enemySenseHidingDistance: [32]
        };
        act1Data.levels = act1Data.startingXPositions.length;

        return act1Data;
    }
    ]
);
