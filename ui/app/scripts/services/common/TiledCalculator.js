'use strict';

angular.module('uiApp').factory('TiledCalculator',
    ['Phaser', 'EasyStar', 'CommonCalculator', 'TiledDisplay',
        function (Phaser, EasyStar, CommonCalculator, TiledDisplay) {
            var tiledCalc = angular.copy(CommonCalculator);

            tiledCalc.moveToPoint = function (sprite, distance, speed) {
                sprite.body.velocity.x = speed * distance.distanceX / distance.distance;
                sprite.body.velocity.y = speed * distance.distanceY / distance.distance;
            };

            tiledCalc.performPathFind = function (body) {
                if (angular.isDefined(body.state.easyStar)) {
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
                                var distance = body.state.calculator.calcDistanceFromSpriteToPoint(body, xGoal, yGoal);
                                body.state.calculator.moveToPoint(body, distance, body.MOVE_SPEED);
                            } else {
                                body.randomXPathFindingGoal();
                            }
                        });
                    }
                } else {
                    body.state.calculator.moveToPoint(
                        body,
                        body.state.calculator.calcDistanceBetweenSprites(body, body.currentPathFindingGoalSprite),
                        body.MOVE_SPEED);
                }
            };

            tiledCalc.findClosestOpponent = function (me, state, opponents, maxDistance, additionalCollisionCheck) {
                var closestOpponent = {distance: undefined, opponent: undefined};
                opponents.forEachAlive(function (e) {
                    var ray = new Phaser.Line(this.calcSpriteCenterX(me), this.calcSpriteCenterY(me), this.calcSpriteCenterX(e), this.calcSpriteCenterY(e));
                    if (ray.length <= maxDistance) {
                        var tileHits = state.blockLayer.getRayCastTiles(ray, undefined, true);
                        if (tileHits.length === 0) {
                            if (angular.isUndefined(additionalCollisionCheck) || additionalCollisionCheck.call(me, ray)) {
                                var distance = this.calcDistanceBetweenSprites(me, e);
                                if (angular.isUndefined(closestOpponent.opponent) || distance.distance < closestOpponent.distance.distance) {
                                    closestOpponent.distance = distance;
                                    closestOpponent.opponent = e;
                                }
                            }
                        } else {
                            TiledDisplay.addTileHitsToDisplay(state, tileHits);
                        }
                    }
                }, this);
                return closestOpponent;
            };
            return tiledCalc;
        }
    ]);
