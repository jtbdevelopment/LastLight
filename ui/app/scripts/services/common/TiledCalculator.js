'use strict';

angular.module('uiApp').factory('TiledCalculator',
    ['Phaser', 'EasyStar', 'CommonCalculator', 'TiledDisplay',
        function (Phaser, EasyStar, CommonCalculator, TiledDisplay) {
            var tiledCalc = angular.copy(CommonCalculator);

            tiledCalc.moveToPoint = function (sprite, distance, speed) {
                sprite.body.velocity.x = speed * distance.distanceX / distance.distance;
                sprite.body.velocity.y = speed * distance.distanceY / distance.distance;
            };

            tiledCalc.calcSpriteTiles = function (body) {
                var tileX = Math.floor(body.x / body.state.map.tileWidth);
                var tileY = Math.floor(body.y / body.state.map.tileHeight);
                return {tileX: tileX, tileY: tileY};
            };

            tiledCalc.performPathFind = function (body) {
                if (angular.isDefined(body.state.easyStar)) {
                    var tiles = this.calcSpriteTiles(body);
                    if (tiles.tileX === body.currentPathFindingGoalXTile && tiles.tileY === body.currentPathFindingGoalYTile) {
                        body.pathFindingGoalReached();
                    }
                    if (body.state.game.time.now > body.nextFindPathTime) {
                        body.nextFindPathTime = body.state.game.time.now + body.state.FIND_PATH_FREQUENCY;
                        body.state.easyStar.findPath(tiles.tileX, tiles.tileY, body.currentPathFindingGoalXTile, body.currentPathFindingGoalYTile, function (path) {
                            if (angular.isDefined(path) && path !== null && path.length > 1) {
                                var calculated = path[1];
                                var xGoal = (calculated.x * body.state.map.tileWidth) + (body.state.map.tileWidth / 2);
                                var yGoal = (calculated.y * body.state.map.tileHeight) + (body.state.map.tileHeight / 2);
                                var distance = body.state.calculator.calcDistanceFromSpriteToPoint(body, xGoal, yGoal);
                                body.state.calculator.moveToPoint(body, distance, body.moveSpeed);
                            } else {
                                body.updatePathFindingGoal();
                            }
                        });
                    }
                } else {
                    body.state.calculator.moveToPoint(
                        body,
                        body.state.calculator.calcDistanceBetweenSprites(body, body.currentPathFindingGoalSprite),
                        body.moveSpeed);
                }
            };

            tiledCalc.findClosest = function (me, state, others) {
                var closest = {distance: undefined, member: undefined};
                angular.forEach(others, function (member) {
                    var distance = this.calcDistanceBetweenSprites(me, member);
                    if (angular.isUndefined(closest.member) || distance.distance < closest.distance.distance) {
                        closest.distance = distance;
                        closest.member = member;
                    }
                }, this);
                return closest;
            };

            tiledCalc.findClosestGroupMember = function (me, state, group) {
                var closest = {distance: undefined, member: undefined};
                group.forEachAlive(function (member) {
                    var distance = this.calcDistanceBetweenSprites(me, member);
                    if (angular.isUndefined(closest.member) || distance.distance < closest.distance.distance) {
                        closest.distance = distance;
                        closest.member = member;
                    }
                }, this);
                return closest;
            };

            tiledCalc.findClosestVisibleGroupMember = function (me, state, group, maxDistance, additionalCollisionCheck) {
                var closest = {distance: undefined, member: undefined};
                group.forEachAlive(function (member) {
                    var ray = new Phaser.Line(this.calcSpriteCenterX(me), this.calcSpriteCenterY(me), this.calcSpriteCenterX(member), this.calcSpriteCenterY(member));
                    if (ray.length <= maxDistance) {
                        var tileHits = state.blockLayer.getRayCastTiles(ray, undefined, true);
                        if (tileHits.length === 0) {
                            if (angular.isUndefined(additionalCollisionCheck) || additionalCollisionCheck.call(me, ray)) {
                                var distance = this.calcDistanceBetweenSprites(me, member);
                                if (angular.isUndefined(closest.member) || distance.distance < closest.distance.distance) {
                                    closest.distance = distance;
                                    closest.member = member;
                                }
                            }
                        } else {
                            TiledDisplay.addTileHitsToDisplay(state, tileHits);
                        }
                    }
                }, this);
                return closest;
            };
            return tiledCalc;
        }
    ]);
