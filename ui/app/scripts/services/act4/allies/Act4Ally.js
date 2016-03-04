/* globals Phaser: false */
'use strict';

var Act4Ally = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.state = undefined;
    this.name = 'Act4Ally';

    this.FIRE = 50;
    this.SEE = 100;
    this.FIRE_PAUSE = 3000;
    this.ARROW_SPEED = 10;
    this.nextFireTime = 0;
    this.initialX = x;
    this.initialY = y;
};

Act4Ally.prototype = Object.create(Phaser.Sprite.prototype);
Act4Ally.prototype.constructor = Act4Ally;

Act4Ally.prototype.updateFunction = function () {
    var closestFire = {distance: 1000000, enemy: undefined};
    var seeRange = {distance: 1000000, enemy: undefined};
    var canFire = (this.state.game.time.now > this.nextFireTime);
    this.state.enemyGroup.forEachAlive(function (e) {
        var xDistance = e.x - this.x;
        var yDistance = e.y - this.y;
        var distance = Math.sqrt(Math.pow(Math.abs(xDistance), 2) + Math.pow(Math.abs(yDistance), 2));
        if (canFire && distance <= this.FIRE) {
            if (distance < closestFire.distance) {
                closestFire.distance = distance;
                closestFire.enemy = e;
                closestFire.xDistance = xDistance;
                closestFire.yDistance = yDistance;
            }
        } else {
            if (distance <= this.SEE) {
                if (distance < seeRange.distance) {
                    seeRange.distance = distance;
                    seeRange.enemy = e;
                    seeRange.xDistance = xDistance;
                    seeRange.yDistance = yDistance;
                }
            }
        }
    }, this);
    if (angular.isDefined(closestFire.enemy)) {
        console.log('fire from ' + this.x + '/' + this.y);
        this.nextFireTime = this.state.game.time.now + this.FIRE_PAUSE;
        var arrow = this.state.arrowsGroup.getFirstExists(false);
        arrow.reset(this.x, this.y);
        var total = Math.abs(closestFire.xDistance) + Math.abs(closestFire.yDistance);
        arrow.body.velocity.x = closestFire.xDistance / total * this.ARROW_SPEED;
        arrow.body.velocity.y = closestFire.yDistance / total * this.ARROW_SPEED;
    } else if (angular.isDefined(seeRange.enemy)) {

    } else {

    }
};

