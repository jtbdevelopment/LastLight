'use strict';

angular.module('uiApp').factory('DisplayUtilities',
    ['Phaser',
        function (Phaser) {
            return {
                initializeWorldShadowing: function (state) {
                    state.shadowTexture = state.game.add.bitmapData(state.game.world.width, state.game.world.height);
                    state.lightSprite = state.game.add.image(state.game.camera.x, state.game.camera.y, state.shadowTexture);
                    state.lightSprite.blendMode = Phaser.blendModes.MULTIPLY;
                },

                updateShadows: function (state, r, g, b) {
                    //  TODO - make a gamma slider  (10, 20,50)
                    r = r || 100;
                    g = g || 120;
                    b = b || 150;

                    state.shadowTexture.context.fillStyle = 'rgb(' + r + ', ' + g + ', ' + b + ')';
                    state.shadowTexture.context.fillRect(0, 0, state.game.world.width, state.game.world.height);
                    state.shadowTexture.dirty = true;
                },
                drawCircleOfLight: function (state, sprite, lightRadius, maxBrightness) {
                    if (angular.isUndefined(maxBrightness)) {
                        maxBrightness = 0.5;
                    }
                    var scale = state.currentScale || 1.0;
                    var radius = lightRadius + state.game.rnd.integerInRange(1, 10);
                    var x = (sprite.x + ((0.5 - sprite.anchor.x) * sprite.width)) * scale;
                    var y = (sprite.y + ((0.5 - sprite.anchor.y) * sprite.height)) * scale;
                    var gradient = state.shadowTexture.context.createRadialGradient(
                        x, y, lightRadius * 0.25,
                        x, y, radius);
                    gradient.addColorStop(0, 'rgba(255, 255, 255, ' + maxBrightness + ')');
                    gradient.addColorStop(1, 'rgba(255, 255, 200, 0.0)');

                    state.shadowTexture.context.beginPath();
                    state.shadowTexture.context.fillStyle = gradient;
                    state.shadowTexture.context.arc(x, y, radius, 0, Math.PI * 2, false);
                    state.shadowTexture.context.fill();
                }
            };
        }
    ]);