'use strict';

/**
 * @ngdoc function
 * @name uiApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the uiApp
 */
angular.module('uiApp')
    .controller('Act4Ctrl', ['$scope', 'GameFactory', function ($scope, GameFactory) {
        $scope.helpText = '';
        GameFactory.state.start('Act4', true, false);
    }]);

