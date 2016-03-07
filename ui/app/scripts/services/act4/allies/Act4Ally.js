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
    this.MAX_PATROL_Y_TILE = 26;
    this.MIN_PATROL_Y_TILE = 7;
    this.nextFireTime = 0;
    this.initialX = x;
    this.initialY = y;
};

Act4Ally.prototype = Object.create(Phaser.Sprite.prototype);
Act4Ally.prototype.constructor = Act4Ally;

Act4Ally.prototype.randomXPatrolGoal = function () {
    return Math.floor(
        Math.max(0,
            (this.initialX + (this.state.game.rnd.integerInRange(0, 50) * this.state.game.rnd.pick([1, -1]))) / this.state.map.tileWidth));
};

Act4Ally.prototype.reset = function (x, y) {
    Phaser.Component.Reset.prototype.reset.call(this, x, y);
    this.initialX = x;
    this.initialY = y;
    this.currentPatrolGoalY = this.MAX_PATROL_Y_TILE;
    this.currentPatrolGoalX = this.randomXPatrolGoal();
};

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
        var tileX = Math.floor(this.x / this.state.map.tileWidth);
        var tileY = Math.floor(this.y / this.state.map.tileHeight);
        if (tileX === this.currentPatrolGoalX && tileY === this.currentPatrolGoalY) {
            this.currentPatrolGoalX = this.randomXPatrolGoal();
            this.currentPatrolGoalY = (tileY === this.MAX_PATROL_Y_TILE) ? this.MIN_PATROL_Y_TILE : this.MAX_PATROL_Y_TILE;
        }
        var calculated;
        console.log(tileX + '/' + this.currentPatrolGoalX);
        this.state.easyStar.findPath(tileX, tileY, this.currentPatrolGoalX, this.currentPatrolGoalY, function (path) {

            if (angular.isDefined(path) && path !== null) {
                calculated = path[1];
                console.log(JSON.stringify(calculated));
            } else {
                console.log('no path');
                //  TODO
            }
        });
        if (angular.isDefined(calculated)) {
            if (tileX === calculated.x) {
                this.body.velocity.x = 0;
            } else if (tileX < calculated.x) {
                this.body.velocity.x = this.MOVE_SPEED;
            } else {
                this.body.velocity.x = this.MOVE_SPEED;
            }
            if (tileY === calculated.y) {
                this.body.velocity.y = 0;
            } else if (tileY < calculated.y) {
                this.body.velocity.y = this.MOVE_SPEED;
            } else {
                this.body.velocity.y = this.MOVE_SPEED;
            }
        } else {
        }
    }
};


