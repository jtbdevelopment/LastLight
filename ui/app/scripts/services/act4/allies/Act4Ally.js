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

Act4Ally.prototype.updateFunction = function () {
    var closestEnemy = {distance: undefined, enemy: undefined};
    this.state.enemyGroup.forEachAlive(function (e) {
        var distance = this.state.calculator.calcDistance(this, e);
        if (angular.isUndefined(closestEnemy.enemy) || distance.distance < closestEnemy.distance.distance) {
            closestEnemy.distance = distance;
            closestEnemy.enemy = e;
        }
    }, this);
    if (angular.isDefined(closestEnemy.enemy) && closestEnemy.distance.distance <= this.SEE) {
        if (closestEnemy.distance.distance <= this.FIRE) {
            if (this.state.game.time.now > this.nextFireTime) {
                this.nextFireTime = this.state.game.time.now + this.FIRE_PAUSE;
                this.body.velocity.x = 0;
                this.body.velocity.y = 0;
                var arrow = this.state.arrowsGroup.getFirstExists(false);
                arrow.reset(Math.floor(this.x + (this.width / 2)), Math.floor(this.y + (this.height / 2)));
                arrow.body.velocity.x = this.ARROW_SPEED * closestEnemy.distance.distanceX / closestEnemy.distance.distance;
                arrow.body.velocity.y = this.ARROW_SPEED * closestEnemy.distance.distanceY / closestEnemy.distance.distance;
            }
            else {
                this.body.velocity.x = -1 * this.MOVE_SPEED * closestEnemy.distance.distanceX / closestEnemy.distance.distance;
                this.body.velocity.y = -1 * this.MOVE_SPEED * closestEnemy.distance.distanceY / closestEnemy.distance.distance;
            }
        } else if (closestEnemy.distance.distance <= this.SEE) {
            this.body.velocity.x = this.MOVE_SPEED * closestEnemy.distance.distanceX / closestEnemy.distance.distance;
            this.body.velocity.y = this.MOVE_SPEED * closestEnemy.distance.distanceY / closestEnemy.distance.distance;
        }
    } else {

    }
};

