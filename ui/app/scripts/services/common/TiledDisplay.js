'use strict';

angular.module('uiApp').factory('TiledDisplay',
    ['Phaser', 'EasyStar',
        function (Phaser, EasyStar) {
            return {
                initializeTileMap: function (state, artworkArray) {
                    state.tileHits = [];
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
                },

                initializeEasyStar: function (state) {
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
                },

                clearTileHitDisplay: function (state) {
                    if (state.DEBUG) {
                        angular.forEach(state.tileHits, function (tileHit) {
                            tileHit.debug = false;
                        });
                        state.blockLayer.dirty = state.tileHits.length > 0;
                    }
                    state.tileHits = [];
                },
                addTileHitsToDisplay: function (state, moreTileHits) {
                    state.tileHits = state.tileHits.concat(moreTileHits);
                },
                showTileHitsDisplay: function (state) {
                    if (state.DEBUG) {
                        angular.forEach(state.tileHits, function (tileHit) {
                            tileHit.debug = state.DEBUG;
                        });
                        state.blockLayer.dirty = state.tileHits.length > 0;
                    }
                }
            };

        }
    ]);