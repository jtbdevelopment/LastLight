'use strict';

angular.module('uiApp').factory('Act4Calculator',
    ['Phaser',
        function (Phaser) {
            return {
                calcDistanceSprites: function (from, to) {
                    return this.calcDistanceSpriteToPoint(
                        from,
                        (to.x + (to.width / 2)),
                        (to.y + (to.height / 2))
                    );
                },
                calcDistanceSpriteToPoint: function (from, toX, toY) {
                    return this.calcDistancePoints(
                        (from.x + (from.width / 2)),
                        (from.y + (from.height / 2)),
                        (toX),
                        (toY)
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
                moveToPoint: function (sprite, distance, speed) {
                    sprite.body.velocity.x = speed * distance.distanceX / distance.distance;
                    sprite.body.velocity.y = speed * distance.distanceY / distance.distance;
                },

                performPathFind: function (body) {
                    var tileX = Math.round(body.x / body.state.map.tileWidth);
                    var tileY = Math.round(body.y / body.state.map.tileHeight);
                    if (tileX === body.currentPathFindingGoalXTile && tileY === body.currentPathFindingGoalYTile) {
                        body.pathFindingGoalReached();
                    }
                    if (body.state.game.time.now > body.nextFindPathTime) {
                        body.nextFindPathTime = body.state.game.time.now + body.state.FIND_PATH_FREQUENCY;
                        body.state.easyStar.findPath(tileX, tileY, body.currentPathFindingGoalXTile, body.currentPathFindingGoalYTile, function (path) {
                            if (angular.isDefined(path) && path !== null && path.length > 1) {
                                var calculated = path[1];
                                var xGoal = (calculated.x * body.state.map.tileWidth) + (body.state.map.tileWidth / 2);
                                var yGoal = (calculated.y * body.state.map.tileHeight) + (body.state.map.tileHeight / 2);
                                var distance = body.state.calculator.calcDistanceSpriteToPoint(body, xGoal, yGoal);
                                body.state.calculator.moveToPoint(body, distance, body.MOVE_SPEED);
                            } else {
                                body.randomXPathFindingGoal();
                            }
                        });
                    }
                },

                findClosestOpponent: function (me, state, group, maxDistance) {
                    var closestOpponent = {distance: undefined, opponent: undefined};
                    group.forEachAlive(function (e) {
                        var ray = new Phaser.Line(me.x + (me.width / 2), me.y + (me.height / 2), e.x + (e.width / 2), e.y + (e.height / 2));
                        if (ray.length <= maxDistance) {
                            var tileHits = state.blockLayer.getRayCastTiles(ray, undefined, true);
                            if (tileHits.length === 0) {
                                var distance = this.calcDistanceSprites(me, e);
                                if (angular.isUndefined(closestOpponent.opponent) || distance.distance < closestOpponent.distance.distance) {
                                    closestOpponent.distance = distance;
                                    closestOpponent.opponent = e;
                                }
                            } else {
                                state.addTileHitsToDisplay(tileHits);
                            }
                        }
                    }, this);
                    return closestOpponent;
                }
            };
        }
    ]);
