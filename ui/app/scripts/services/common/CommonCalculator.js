'use strict';

angular.module('uiApp').factory('CommonCalculator',
    [
        function () {
            return {
                calcDistanceBetweenSprites: function (from, to) {
                    return this.calcDistanceFromSpriteToPoint(
                        from,
                        (to.x + (to.width / 2)),
                        (to.y + (to.height / 2))
                    );
                },
                calcDistanceFromSpriteToPoint: function (from, toX, toY) {
                    return this.calcDistanceBetweenPoints(
                        (from.x + (from.width / 2)),
                        (from.y + (from.height / 2)),
                        (toX),
                        (toY)
                    );
                },
                calcDistanceBetweenPoints: function (fromX, fromY, toX, toY) {
                    var distanceX = toX - fromX;
                    var x2 = Math.pow(distanceX, 2);
                    var distanceY = toY - fromY;
                    var y2 = Math.pow(distanceY, 2);
                    var distance = Math.sqrt(x2 + y2);
                    return {distanceX: distanceX, distanceY: distanceY, distance: distance};
                },

                moveToPoint: function (sprite, distance, speed) {
                    sprite.body.velocity.x = speed * distance.distanceX / distance.distance;
                    sprite.body.velocity.y = speed * distance.distanceY / distance.distance;
                }

            };
        }
    ]);
