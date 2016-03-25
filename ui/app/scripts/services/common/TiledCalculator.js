'use strict';

angular.module('uiApp').factory('TiledCalculator',
    ['Phaser', 'EasyStar', 'CommonCalculator',
        function (Phaser, EasyStar, CommonCalculator) {
            var tiledCalc = angular.copy(CommonCalculator);

            tiledCalc.moveToPoint = function (sprite, distance, speed) {
                sprite.body.velocity.x = speed * distance.distanceX / distance.distance;
                sprite.body.velocity.y = speed * distance.distanceY / distance.distance;
            };

            tiledCalc.initializeTileMap = function (state, artworkArray) {
                state.map = state.game.add.tilemap('tilemap');
                angular.forEach(artworkArray, function (artwork) {
                    state.map.addTilesetImage(artwork);
                });

                state.pathLayer = state.map.createLayer('Path Layer');
                state.blockLayer = state.map.createLayer('Block Layer');
                state.blockLayer.debug = state.DEBUG;
                state.blockLayer.resizeWorld();
                var tileIds = [];
                state.blockLayer.layer.data.forEach(function (layerRow) {
                    layerRow.forEach(function (layerCell) {
                        if (layerCell.index > 0) {
                            if (tileIds.indexOf(layerCell.index) < 0) {
                                tileIds.push(layerCell.index);
                            }
                        }
                    });
                });
                tileIds = tileIds.sort();
                state.map.setCollision(tileIds, true, state.blockLayer);
            };

            tiledCalc.initializeEasyStar = function (state) {
                state.easyStar = new EasyStar.js();
                var easyGrid = [];
                angular.forEach(state.blockLayer.layer.data, function (row) {
                    var easyRow = [];
                    angular.forEach(row, function (cell) {
                        easyRow.push(cell.index);
                    });
                    easyGrid.push(easyRow);
                });
                state.easyStar.setGrid(easyGrid);
                state.easyStar.setAcceptableTiles([-1]);
                state.easyStar.enableDiagonals();
                state.easyStar.enableSync();
            };

            tiledCalc.performPathFind = function (body) {
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
            };

            tiledCalc.findClosestOpponent = function (me, state, opponents, maxDistance, additionalCollisionCheck) {
                var closestOpponent = {distance: undefined, opponent: undefined};
                opponents.forEachAlive(function (e) {
                    var ray = new Phaser.Line(me.x + (me.width / 2), me.y + (me.height / 2), e.x + (e.width / 2), e.y + (e.height / 2));
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
                            state.addTileHitsToDisplay(tileHits);
                        }
                    }
                }, this);
                return closestOpponent;
            };
            return tiledCalc;
        }
    ]);
