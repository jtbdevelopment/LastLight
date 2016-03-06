'use strict';

angular.module('uiApp').factory('Act4Calculator',
    [
        function () {
            return {
                calcDistance: function (from, to) {
                    var distanceX = ((to.x + (to.width / 2)) - (from.x + (from.width / 2)));
                    var x2 = Math.pow(distanceX, 2);
                    var distanceY = ((to.y + (to.height / 2)) - (from.y + (from.height / 2)));
                    var y2 = Math.pow(distanceY, 2);
                    var distance = Math.sqrt(x2 + y2);
                    return {distanceX: distanceX, distanceY: distanceY, distance: distance};
                },
            };
        }
    ]);
