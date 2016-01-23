'use strict';

angular.module('uiApp').factory('Act3Settings',
    [function () {
        var act3Data = {
            startingXPositions: [],
            startingYPositions: [],
            addsArrowsAtEnd: []
        };
        act3Data.levels = 3;
        for (var i = 0; i < act3Data.levels; ++i) {
            act3Data.startingXPositions.push(0);
            act3Data.startingYPositions.push(175 - 32 - 16);
            act3Data.addsArrowsAtEnd.push(0);
        }

        return act3Data;
    }]
);
