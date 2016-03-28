'use strict';

angular.module('uiApp').factory('TiledCalculator',
    ['Phaser', 'EasyStar', 'CommonCalculator', 'TiledDisplay',
        function (Phaser, EasyStar, CommonCalculator, TiledDisplay) {
            var tiledCalc = angular.copy(CommonCalculator);

            tiledCalc.moveToPoint = function (sprite, distance, speed) {
                sprite.body.velocity.x = speed * distance.distanceX / distance.distance;
                sprite.body.velocity.y = speed * distance.distanceY / distance.distance;
            };

            tiledCalc.calcSpriteTiles = function (sprite) {
                var tileX = Math.floor(this.calcSpriteCenterX(sprite, sprite.state.currentScale) / sprite.state.map.tileWidth);
                var tileY = Math.floor(this.calcSpriteCenterY(sprite, sprite.state.currentScale) / sprite.state.map.tileHeight);
                return {tileX: tileX, tileY: tileY};
            };

            tiledCalc.performPathFind = function (sprite) {
                if (angular.isDefined(sprite.state.easyStar)) {
                    var tiles = this.calcSpriteTiles(sprite);
                    if (tiles.tileX === sprite.currentPathFindingGoalXTile && tiles.tileY === sprite.currentPathFindingGoalYTile) {
                        sprite.pathFindingGoalReached();
                    }
                    if (sprite.state.game.time.now > sprite.nextFindPathTime) {
                        sprite.nextFindPathTime = sprite.state.game.time.now + sprite.state.FIND_PATH_FREQUENCY;
                        sprite.state.easyStar.findPath(tiles.tileX, tiles.tileY, sprite.currentPathFindingGoalXTile, sprite.currentPathFindingGoalYTile, function (path) {
                            if (angular.isDefined(path) && path !== null && path.length > 1) {
                                var calculated = path[1];
                                var xGoal = (calculated.x * sprite.state.map.tileWidth) + (sprite.state.map.tileWidth / 2);
                                var yGoal = (calculated.y * sprite.state.map.tileHeight) + (sprite.state.map.tileHeight / 2);
                                var distance = sprite.state.calculator.calcDistanceFromSpriteToPoint(sprite, xGoal, yGoal);
                                sprite.state.calculator.moveToPoint(sprite, distance, sprite.moveSpeed);
                            } else {
                                sprite.updatePathFindingGoal();
                            }
                        });
                    }
                } else {
                    sprite.state.calculator.moveToPoint(
                        sprite,
                        sprite.state.calculator.calcDistanceBetweenSprites(sprite, sprite.currentPathFindingGoalSprite),
                        sprite.moveSpeed);
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
