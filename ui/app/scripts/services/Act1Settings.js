'use strict';

angular.module('uiApp').factory('Act1Settings',
    [function () {
        var act1Data = {
            startingXPositions: [16],
            startingYPositions: [1264],
            playerHidingLightRadius: [10],
            playerMovingLightRadius: [40],
            enemySenseHidingDistance: [32],
            addsCandlesAtEnd: [0]
        };
        act1Data.levels = act1Data.startingXPositions.length;
        while(act1Data.playerHidingLightRadius.length < act1Data.startingXPositions.length) {
            act1Data.playerHidingLightRadius.push(20);
        }
        while(act1Data.playerMovingLightRadius.length < act1Data.startingXPositions.length) {
            act1Data.playerMovingLightRadius.push(60);
        }
        while(act1Data.addsCandlesAtEnd.length < act1Data.startingXPositions.length) {
            act1Data.enemySenseHidingDistance.push(40);
        }
        while(act1Data.addsCandlesAtEnd.length < act1Data.startingXPositions.length) {
            act1Data.addsCandlesAtEnd.push(0);
        }

        return act1Data;
    }
    ]
);
