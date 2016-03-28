'use strict';

angular.module('uiApp').factory('CommonCalculator',
    ['Phaser',
        function (Phaser) {
            return {
                calcSpriteCenterX: function (sprite, scale) {
                    scale = scale || 1.0;
                    return Math.round((sprite.x + ((0.5 - sprite.anchor.x) * sprite.width)) * scale);
                },
                calcSpriteCenterY: function (sprite, scale) {
                    scale = scale || 1.0;
                    return Math.round((sprite.y + ((0.5 - sprite.anchor.y) * sprite.height)) * scale);
                },

                calcDistanceBetweenSprites: function (from, to) {
                    return this.calcDistanceFromSpriteToPoint(
                        from,
                        this.calcSpriteCenterX(to),
                        this.calcSpriteCenterY(to)
                    );
                },
                calcDistanceFromSpriteToPoint: function (from, toX, toY) {
                    return this.calcDistanceBetweenPoints(
                        this.calcSpriteCenterX(from),
                        this.calcSpriteCenterY(from),
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
                    sprite.body.velocity.x = Math.round(speed * distance.distanceX / distance.distance);
                    sprite.body.velocity.y = Math.round(speed * distance.distanceY / distance.distance);
                },

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
                    var x = this.calcSpriteCenterX(sprite, scale);
                    var y = this.calcSpriteCenterY(sprite, scale);
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
