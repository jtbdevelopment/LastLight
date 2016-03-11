'use strict';

angular.module('uiApp').factory('Act4Calculator',
    ['Phaser',
        function (Phaser) {
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
                },
                findClosestOpponent: function (me, state, group, maxDistance) {
                    var closestOpponent = {distance: undefined, opponent: undefined};
                    group.forEachAlive(function (e) {
                        var ray = new Phaser.Line(me.x, me.y, e.x, e.y);
                        if (ray.length <= maxDistance) {
                            var tileHits = state.blockLayer.getRayCastTiles(ray, undefined, true);
                            state.addTileHitsToDisplay(tileHits);

                            if (tileHits.length === 0) {
                                var distance = this.calcDistanceSprites(me, e);
                                if (angular.isUndefined(closestOpponent.opponent) || distance.distance < closestOpponent.distance.distance) {
                                    closestOpponent.distance = distance;
                                    closestOpponent.opponent = e;
                                }
                            }
                        }
                    }, this);
                    return closestOpponent;
                }
            };
        }
    ]);
