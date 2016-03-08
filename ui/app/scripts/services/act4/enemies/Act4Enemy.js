/* globals Phaser: false */
'use strict';

var Act4Enemy = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.state = undefined;
    this.name = 'Act4Enemy';

    this.FIRE = 50;
    this.SEE = 100;
    this.FIRE_PAUSE = 3000;
    this.ARROW_SPEED = 40;
    this.MOVE_SPEED = 25;
    this.SEE_WALL_TILE = 26;
    this.FIND_PATH_PAUSE = 2000;
    this.nextFireTime = 0;
    this.nextFindPathTime = 0;
    this.initialX = x;
    this.initialY = y;
};

Act4Enemy.prototype = Object.create(Phaser.Sprite.prototype);
Act4Enemy.prototype.constructor = Act4Enemy;

Act4Enemy.prototype.reset = function (x, y) {
    Phaser.Component.Reset.prototype.reset.call(this, x, y);
    this.initialX = x;
    this.initialY = y;
    this.currentPatrolGoalYTile = this.SEE_WALL_TILE;
    this.currentPatrolGoalY = this.currentPatrolGoalYTile * this.state.map.tileHeight;
    this.currentPatrolGoalX = x;
    this.currentPatrolGoalXTile = Math.floor(this.currentPatrolGoalX / this.state.map.tileWidth);
};

Act4Enemy.prototype.activateFunction = function (health, damage, size) {
    this.health = health;
    this.damage = damage;
    this.body.height = size * this.state.scale;
    this.body.width = size * this.state.scale;
    this.height = size;
    this.width = size;
};

Act4Enemy.prototype.updateFunction = function () {
    if (this.state.game.time.now > this.nextFindPathTime) {
        this.nextFindPathTime = this.state.game.time.now + this.FIND_PATH_PAUSE;
        var tileX = Math.round(this.x / this.state.map.tileWidth);
        var tileY = Math.round(this.y / this.state.map.tileHeight);
        if (tileX === this.currentPatrolGoalXTile && tileY === this.currentPatrolGoalYTile) {
            console.log('at wall');
        } else {
            var calculated;
            var body = this;
            this.state.easyStar.findPath(tileX, tileY, this.currentPatrolGoalXTile, this.currentPatrolGoalYTile, function (path) {
                if (angular.isDefined(path) && path !== null) {
                    calculated = path[1];
                    if (tileX === calculated.x) {
                        body.body.velocity.x = body.state.game.rnd.integerInRange(0, 5) * (body.x < body.currentPatrolGoalX ? 1 : -1);
                    } else if (tileX < calculated.x) {
                        body.body.velocity.x = body.MOVE_SPEED;
                    } else {
                        body.body.velocity.x = -body.MOVE_SPEED;
                    }
                    if (tileY === calculated.y) {
                        body.body.velocity.y = body.state.game.rnd.integerInRange(0, 5) * (body.y < body.currentPatrolGoalY ? 1 : -1);
                    } else if (tileY < calculated.y) {
                        body.body.velocity.y = body.MOVE_SPEED;
                    } else {
                        body.body.velocity.y = -body.MOVE_SPEED;
                    }
                } else {
                    body.currentPatrolGoalXTile += 1;
                    body.currentPatrolGoalX += body.state.map.tileWidth;
                    //  TODO
                }
            });
        }
    }
};

