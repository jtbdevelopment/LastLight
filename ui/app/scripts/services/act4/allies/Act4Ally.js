/* globals Phaser: false */
'use strict';

var Act4Ally = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.state = undefined;
    this.name = 'Act4Ally';

    this.FIRE = 50;
    this.SEE = 100;
    this.FIRE_PAUSE = 3000;
    this.ARROW_SPEED = 30;
    this.MOVE_SPEED = 10;
    this.nextFireTime = 0;
    this.initialX = x;
    this.initialY = y;
};

Act4Ally.prototype = Object.create(Phaser.Sprite.prototype);
Act4Ally.prototype.constructor = Act4Ally;

var calcDistance = function (to, from) {
    var distanceX = (to.x + (to.width / 2) - from.x + (from.width / 2));
    var x2 = Math.pow(distanceX, 2);
    var distanceY = (to.y + (to.height / 2) - from.y + (from.height / 2));
    var y2 = Math.pow(distanceY, 2);
    var distanceFactor = Math.sqrt(x2 + y2);
    return {distanceX: distanceX, distanceY: distanceY, distanceFactor: distanceFactor};
};

Act4Ally.prototype.updateFunction = function () {
    var closestEnemy = {distance: undefined, enemy: undefined};
    var seeRange = {distance: undefined, enemy: undefined};
    this.state.enemyGroup.forEachAlive(function (e) {
        var distance = calcDistance(e, this);
        if (angular.isUndefined(closestEnemy.enemy) || distance.distanceFactor < closestEnemy.distance.distanceFactor) {
            closestEnemy.distance = distance;
            closestEnemy.enemy = e;
        }
    }, this);
    if (angular.isDefined(closestEnemy.enemy) && closestEnemy.distance.distanceFactor <= this.SEE) {
        if (closestEnemy.distance.distanceFactor <= this.FIRE) {
            if (this.state.game.time.now > this.nextFireTime) {
                this.nextFireTime = this.state.game.time.now + this.FIRE_PAUSE;
                this.body.velocity.x = 0;
                this.body.velocity.y = 0;
                var arrow = this.state.arrowsGroup.getFirstExists(false);
                arrow.reset(this.x, this.y);
                arrow.body.velocity.x = this.ARROW_SPEED * closestEnemy.distance.distanceX / closestEnemy.distance.distanceFactor;
                arrow.body.velocity.y = this.ARROW_SPEED * closestEnemy.distance.distanceY / closestEnemy.distance.distanceFactor;
            }
            else {
                this.body.velocity.x = -1 * this.MOVE_SPEED * closestEnemy.distance.distanceX / closestEnemy.distance.distanceFactor;
                this.body.velocity.y = -1 * this.MOVE_SPEED * closestEnemy.distance.distanceY / closestEnemy.distance.distanceFactor;
            }
        } else if (closestEnemy.distance.distanceFactor <= this.SEE) {
            this.body.velocity.x = this.MOVE_SPEED * closestEnemy.distance.distanceX / closestEnemy.distance.distanceFactor;
            this.body.velocity.y = this.MOVE_SPEED * closestEnemy.distance.distanceY / closestEnemy.distance.distanceFactor;
        }
    } else {

    }
};

