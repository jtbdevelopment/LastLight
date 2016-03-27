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
    this.initialTileX = Math.round(this.state.calculator.calcSpriteCenterX(this) / this.state.map.tileWidth);
    this.initialTileY = Math.round(this.state.calculator.calcSpriteCenterY(this) / this.state.map.tileHeight);

    this.body.debug = this.state.DEBUG;
    this.body.collideWorldBounds = true;
    this.body.fixedRotation = true;
    this.updatePathFindingGoal();
    this.body.setZeroDamping();
    this.safe = false;
    this.nextFindPathTime = 0;

    this.moveSpeed = 5;

    this.closestFire = this.state.calculator.findClosestGroupMember(this, this.state, this.state.bonfireGroup).member;
    this.closestFireTileX = Math.round(this.state.calculator.calcSpriteCenterX(this.closestFire) / this.state.map.tileWidth);
    this.closestFireTileY = Math.round(this.state.calculator.calcSpriteCenterY(this.closestFire) / this.state.map.tileHeight);
};

Act2TownsPerson.prototype.updateFunction = function () {
    if (!this.safe) {
        if (this.closestFire.lit) {
            this.currentPathFindingGoalYTile = this.closestFireTileY;
            this.currentPathFindingGoalXTile = this.closestFireTileX;
            this.state.calculator.performPathFind(this);
            return;
        }
    }
    this.state.calculator.performPathFind(this);
};

Act2TownsPerson.prototype.updatePathFindingGoal = function () {
    this.currentPathFindingGoalXTile = this.initialTileX + (this.state.game.rnd.integerInRange(0, this.state.levelData.townPersonMoveTiles) * this.state.game.rnd.sign());
    this.currentPathFindingGoalYTile = this.initialTileY + (this.state.game.rnd.integerInRange(0, this.state.levelData.townPersonMoveTiles) * this.state.game.rnd.sign());
};

Act2TownsPerson.prototype.pathFindingGoalReached = function () {
    if (!this.closestFire.lit) {
        this.updatePathFindingGoal();
    }
};


