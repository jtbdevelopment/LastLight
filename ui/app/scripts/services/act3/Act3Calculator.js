'use strict';

angular.module('uiApp').factory('Act3Calculator',
    [
        function () {
            return {
                calcDistance: function (playerCenter, sprite) {
                    var distanceX = (playerCenter.attackX - sprite.x + (sprite.width / 2));
                    var x2 = Math.pow(distanceX, 2);
                    var distanceY = (playerCenter.attackY - sprite.y + (sprite.height / 2));
                    var y2 = Math.pow(distanceY, 2);
                    var distanceFactor = Math.floor(Math.sqrt(x2 + y2));
                    return {distanceX: distanceX, distanceY: distanceY, distanceFactor: distanceFactor};
                },
                calcPlayerGroupCenter: function (state) {
                    var attackX = 0, attackY = 0, count = 0;
                    angular.forEach(state.players.children, function (p) {
                        if (p.alive) {
                            count += 1;
                            attackX += p.x + p.width / 2;
                            attackY += p.y + p.height / 2;
                        }

                    }, this);
                    if (count > 0) {
                        attackX = attackX / count;
                        attackY = attackY / count;
                    }
                    return {attackX: attackX, attackY: attackY, count: count};
                },

                turnToPlayerCenter: function(playerCenter, sprite, turnRate) {
                    if (playerCenter.count > 0) {
                        var speed = (Math.abs(sprite.body.velocity.x) + Math.abs(sprite.body.velocity.y));
                        var distance = this.calcDistance(playerCenter, sprite);
                        sprite.body.velocity.x += turnRate * distance.distanceX / distance.distanceFactor;
                        sprite.body.velocity.y += turnRate * distance.distanceY / distance.distanceFactor;
                        var total = speed / (Math.abs(sprite.body.velocity.x) + Math.abs(sprite.body.velocity.y));
                        sprite.body.velocity.x *= total;
                        sprite.body.velocity.y *= total;
                    }
                }

            };
        }
    ]);
