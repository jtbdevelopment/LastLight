'use strict';

angular.module('uiApp').factory('DisplayUtilities',
    [
        function () {
            return {
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