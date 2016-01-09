'use strict';

/**
 * Same as act1 but with initial candles
 */
angular.module('uiApp')
    .controller('Act1TempCtrl', ['$scope', 'GameFactory', function ($scope, GameFactory) {
        $scope.helpText = 'Use arrow keys to move. Find the light, avoid the demons. Use and move the rocks for cover.  Press C to hide in place. You cannot move while hiding, but demons must be much closer to spot you.';
        GameFactory.state.start('Act1', true, false, 0, 10);
    }]);
