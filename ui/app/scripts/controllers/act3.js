'use strict';

/**
 * @ngdoc function
 * @name uiApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the uiApp
 */
angular.module('uiApp')
    .controller('Act3Ctrl', ['$scope', 'GameFactory', function ($scope, GameFactory) {
        $scope.helpText = 'Use arrow keys to move.';
        GameFactory.state.start('Act3', true, false, 0, 1000);
    }]);

