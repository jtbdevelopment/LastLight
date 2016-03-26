'use strict';

angular.module('uiApp').factory('Act3Calculator',
    ['CommonCalculator',
        function (CommonCalculator) {

            var act3Calc = angular.copy(CommonCalculator);

            act3Calc.calcDistanceFromSpriteToPlayerCenter = function (playerCenter, sprite) {
                return this.calcDistanceFromSpriteToPoint(sprite, playerCenter.attackX, playerCenter.attackY);
            };

            act3Calc.calcPlayerGroupCenter = function (state) {
                var attackX = 0, attackY = 0, count = 0;
                angular.forEach(state.players.children, function (p) {
                    if (p.alive) {
                        count += 1;
                        attackX += this.calcSpriteCenterX(p);
                        attackY += this.calcSpriteCenterY(p);
                    }

                }, this);
                if (count > 0) {
                    attackX = attackX / count;
                    attackY = attackY / count;
                }
                return {attackX: attackX, attackY: attackY, count: count};
            };
            act3Calc.turnToPlayerCenter = function (playerCenter, sprite, turnRate) {
                if (playerCenter.count > 0) {
                    var speed = (Math.abs(sprite.body.velocity.x) + Math.abs(sprite.body.velocity.y));
                    var distance = this.calcDistanceFromSpriteToPlayerCenter(playerCenter, sprite);
                    sprite.body.velocity.x += turnRate * distance.distanceX / distance.distance;
                    sprite.body.velocity.y += turnRate * distance.distanceY / distance.distance;
                    var total = speed / (Math.abs(sprite.body.velocity.x) + Math.abs(sprite.body.velocity.y));
                    sprite.body.velocity.x *= total;
                    sprite.body.velocity.y *= total;
                }
            };
            return act3Calc;
        }
    ]);
