/* globals Phaser: false */
'use strict';

var Act4Ally = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.state = undefined;
    this.name = 'Act4Ally';

    this.MOVE_SPEED = 15;
    this.MAX_PATROL_Y_TILE = 26;
    this.MIN_PATROL_Y_TILE = 7;
    this.nextFireTime = 0;
    this.nextFindPathTime = 0;
    this.initialX = x;
    this.initialY = y;
};

Act4Ally.prototype = Object.create(Phaser.Sprite.prototype);
Act4Ally.prototype.constructor = Act4Ally;

Act4Ally.prototype.randomXPatrolGoal = function () {
    return Math.max(0,
        this.initialX + (this.state.game.rnd.integerInRange(0, 50) * this.state.game.rnd.pick([1, -1])));
};

Act4Ally.prototype.reset = function (x, y) {
    Phaser.Component.Reset.prototype.reset.call(this, x, y);
    this.initialX = x;
    this.initialY = y;
    this.currentPatrolGoalYTile = this.MAX_PATROL_Y_TILE;
    this.currentPatrolGoalY = this.currentPatrolGoalYTile * this.state.map.tileHeight;
    this.currentPatrolGoalX = this.randomXPatrolGoal();
    this.currentPatrolGoalXTile = Math.floor(this.currentPatrolGoalX / this.state.map.tileWidth);
};

Act4Ally.prototype.updateFunction = function () {
    var closestEnemy = {distance: undefined, enemy: undefined};
    this.state.enemyGroup.forEachAlive(function (e) {
        var ray = new Phaser.Line(this.x, this.y, e.x, e.y);
        if (ray.length < this.state.ALLY_SEE_DISTANCE) {
            var tileHits = this.state.blockLayer.getRayCastTiles(ray, undefined, true);
            this.state.addTileHitsToDisplay(tileHits);

            if (tileHits.length === 0) {
                var distance = this.state.calculator.calcDistanceSprites(this, e);
                if (angular.isUndefined(closestEnemy.enemy) || distance.distance < closestEnemy.distance.distance) {
                    closestEnemy.distance = distance;
                    closestEnemy.enemy = e;
                }
            }
        }
    }, this);
    if (angular.isDefined(closestEnemy.enemy) && closestEnemy.distance.distance <= this.state.ALLY_SEE_DISTANCE) {
        this.nextFindPathTime = 0;
        if (closestEnemy.distance.distance <= this.state.ALLY_FIRE_DISTANCE) {
            if (this.state.game.time.now > this.nextFireTime) {
                this.nextFireTime = this.state.game.time.now + this.state.ALLY_FIRE_RATE;
                this.body.velocity.x = 0;
                this.body.velocity.y = 0;
                var arrow = this.state.arrowsGroup.getFirstExists(false);
                arrow.reset(Math.floor(this.x + (this.width / 2)), Math.floor(this.y + (this.height / 2)));
                arrow.initialX = arrow.x;
                arrow.initialY = arrow.y;
                arrow.firer = this;
                arrow.body.velocity.x = this.state.ALLY_ARROW_SPEED * closestEnemy.distance.distanceX / closestEnemy.distance.distance;
                arrow.body.velocity.y = this.state.ALLY_ARROW_SPEED * closestEnemy.distance.distanceY / closestEnemy.distance.distance;
            }
            else {
                this.body.velocity.x = -1 * this.MOVE_SPEED * closestEnemy.distance.distanceX / closestEnemy.distance.distance;
                this.body.velocity.y = -1 * this.MOVE_SPEED * closestEnemy.distance.distanceY / closestEnemy.distance.distance;
            }
        } else if (closestEnemy.distance.distance <= this.state.ALLY_SEE_DISTANCE) {
            this.body.velocity.x = this.MOVE_SPEED * closestEnemy.distance.distanceX / closestEnemy.distance.distance;
            this.body.velocity.y = this.MOVE_SPEED * closestEnemy.distance.distanceY / closestEnemy.distance.distance;
        }
    } else {
        if (this.state.game.time.now > this.nextFindPathTime) {
            this.nextFindPathTime = this.state.game.time.now + this.state.FIND_PATH_FREQUENCY;
            var tileX = Math.round(this.x / this.state.map.tileWidth);
            var tileY = Math.round(this.y / this.state.map.tileHeight);
            if (tileX === this.currentPatrolGoalXTile && tileY === this.currentPatrolGoalYTile) {
                this.currentPatrolGoalX = this.randomXPatrolGoal();
                this.currentPatrolGoalXTile = Math.floor(this.currentPatrolGoalX / this.state.map.tileWidth);
                this.currentPatrolGoalYTile = (tileY === this.MAX_PATROL_Y_TILE) ? this.MIN_PATROL_Y_TILE : this.MAX_PATROL_Y_TILE;
                this.currentPatrolGoalY = this.currentPatrolGoalYTile * this.state.map.tileHeight;
            }
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
                    body.currentPatrolGoalX = body.randomXPatrolGoal();
                    body.currentPatrolGoalXTile = Math.floor(body.currentPatrolGoalX / body.state.map.tileWidth);
                }
            });
        }
    }
};


