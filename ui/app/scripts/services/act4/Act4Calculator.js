'use strict';

angular.module('uiApp').factory('Act4Calculator',
    [
        function () {
            return {
                calcDistanceSprites: function (from, to) {
                    return this.calcDistancePoints(
                        (from.x + (from.width / 2)),
                        (from.y + (from.height / 2)),
                        (to.x + (to.width / 2)),
                        (to.y + (to.height / 2))
                    );
                },
                calcDistancePoints: function (fromX, fromY, toX, toY) {
                    var distanceX = toX - fromX;
                    var x2 = Math.pow(distanceX, 2);
                    var distanceY = toY - fromY;
                    var y2 = Math.pow(distanceY, 2);
                    var distance = Math.sqrt(x2 + y2);
                    return {distanceX: distanceX, distanceY: distanceY, distance: distance};
                }
            };
        }
    ]);
