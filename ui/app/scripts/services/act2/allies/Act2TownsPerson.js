/* globals Phaser: false */
'use strict';

var Act2TownsPerson = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.name = 'Act2TownsPerson';
    this.state = undefined;
    this.settings = undefined;
};

Act2TownsPerson.prototype = Object.create(Phaser.Sprite.prototype);
Act2TownsPerson.prototype.constructor = Act2TownsPerson;

Act2TownsPerson.prototype.reset = function (x, y, health) {
    Phaser.Component.Reset.prototype.reset.call(this, x, y, health);
    this.body.setCircle(10);
    this.initialX = x;
    this.initialY = y;
    var initialTiles = this.state.calculator.calcSpriteTiles(this);
    this.initialTileX = initialTiles.tileX;
    this.initialTileY = initialTiles.tileY;

    this.body.debug = this.state.DEBUG;
    this.body.collideWorldBounds = true;
    this.body.fixedRotation = true;
    this.body.setZeroDamping();
    this.safe = false;
    this.nextFindPathTime = 0;
    this.nextRandomGoal = 0;
    this.outOfBoundsKill = false;
    this.checkWorldBounds = false;

    this.moveSpeed = 15;

    this.closestFire = this.state.calculator.findClosestGroupMember(this, this.state, this.state.bonfireGroup).member;
    var fireTiles = this.state.calculator.calcSpriteTiles(this.closestFire);
    this.closestFireTileX = fireTiles.tileX;
    this.closestFireTileY = fireTiles.tileY;
    this.updatePathFindingGoal();
};

Act2TownsPerson.prototype.updateFunction = function () {
    if (this.safe) {
        if (this.state.calculator.calcDistanceBetweenSprites(this, this.closestFire).distance < (32 * 1.5)) {
            this.body.mass = 0.1;
            this.body.setZeroVelocity();
        }
        if (this.state.calculator.calcDistanceBetweenSprites(this, this.closestFire).distance < (32 * 2.2)) {
            return;
        }
    }
    if (this.closestFire.lit) {
        if (this.state.calculator.calcDistanceBetweenSprites(this, this.closestFire).distance < (32 * 2.2)) {
            this.safe = true;
            return;
        }
        this.currentPathFindingGoalYTile = this.closestFireTileY;
        this.currentPathFindingGoalXTile = this.closestFireTileX;
    } else {
        if (this.state.game.time.now > this.nextRandomGoal) {
            this.nextRandomGoal = this.state.game.time.now + 5000;
            this.updatePathFindingGoal();
        }
    }

    this.state.calculator.performPathFind(this);
};

Act2TownsPerson.prototype.updatePathFindingGoal = function () {
    if (!this.closestFire.lit) {
        this.currentPathFindingGoalXTile = this.initialTileX + (this.state.game.rnd.integerInRange(1, this.state.levelData.townPersonMoveTiles) * this.state.game.rnd.sign());
        this.currentPathFindingGoalYTile = this.initialTileY + (this.state.game.rnd.integerInRange(1, this.state.levelData.townPersonMoveTiles) * this.state.game.rnd.sign());
        if (this.currentPathFindingGoalXTile < 0 ||
            this.currentPathFindingGoalXTile >= this.state.map.width ||
            this.currentPathFindingGoalYTile < 0 ||
            this.currentPathFindingGoalYTile >= this.state.map.height ||
            this.state.blockLayer.layer.data[this.currentPathFindingGoalYTile][this.currentPathFindingGoalXTile].index !== -1) {
            this.updatePathFindingGoal();
        }
    }
};

Act2TownsPerson.prototype.pathFindingGoalReached = function () {
    if (!this.closestFire.lit) {
        this.updatePathFindingGoal();
    }
};


