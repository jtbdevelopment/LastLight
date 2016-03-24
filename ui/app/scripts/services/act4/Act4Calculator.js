'use strict';

angular.module('uiApp').factory('Act4Calculator',
    ['Phaser', 'TiledCalculator',
        function (Phaser, TiledCalculator) {
            var act4Calc = angular.copy(TiledCalculator);
            //  TODO - eliminate?
            return act4Calc;
        }
    ]);
