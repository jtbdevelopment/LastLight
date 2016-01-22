'use strict';

var VERTICAL_FORMATION = 1;
var HORIZONTAL_FORMATION = 2;
var WEDGE_FORMATION = 3;
var BLOCK_FORMATION = 4;

angular.module('uiApp').factory('Act3ScrollingState',
    ['$timeout',
        function ($timeout) {
            return {
                game: undefined,
                load: undefined,
                data: undefined,
                state: undefined,

                PLAYER_HELPERS: 6,
                PLAYER_MOVE_SPEED: 4,
                PLAYER_FIRE_FREQUENCY: 500,
                PLAYER_ARROW_VELOCITY: 300,

                PLAYER_REVIVE_RATE: 30 * 1000,
                PLAYER_INVULNERABLE_RATE: 10 * 1000,

                PLAYER_LIGHT_RADIUS: 100,

                DEBUG: false,
                tileHits: [],

                //  Phaser state functions - begin
                init: function (level, arrowsRemaining) {
                    this.LEVEL = level;
                    this.ARROWS_REMAINING = arrowsRemaining;
                    //  TODO
                    this.CURRENT_FORMATION = VERTICAL_FORMATION;
                    this.PLAYER_START_X = 0;
                    this.PLAYER_START_Y = 0;
                    this.NEXT_FIRE_TIME = 0;
                },
                preload: function () {
                    //  Note tile asset IDs do not match because 0 represents no tile
                    //  So in tiled - a tile will be asset id 535
                    //  In json file it will be 536
                    //  When remapping images from one to another you would need to say 536 -> 535

                    //  TODO - actual art
                    //  TODO - physics for art
                    //  https://code.google.com/p/box2d-editor/
                    //  http://phaser.io/examples/v2/p2-physics/load-polygon-1
                    //  TODO - music
                    this.load.image('player', 'images/HB_Dwarf05.png');
                    this.load.image('demon', 'images/DemonMinorFighter.png');
                    this.load.image('arrow', 'images/enemy-bullet.png')
                },
                create: function () {
                    this.game.ending = false;

                    this.game.world.resize(600, 600);

                    this.game.physics.startSystem(Phaser.Physics.ARCADE);
                    this.game.physics.arcade.setBoundsToWorld(true, true, true, true, false);
                    this.createPlayerGroup();
                    this.createArrowGroup();
                    this.createEnemies();
                    this.initializeWorldShadowing();
                    this.initializeArrowTracker();
                    this.initializeKeyboard();
                    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
                    $timeout(this.revivePlayer, this.PLAYER_REVIVE_RATE, true, this);
                },
                update: function () {
                    if (!this.game.ending) {
                        this.handlePlayerMovement();
                    }
                    //  TODO - move this out
                    if (this.enemies.getFirstExists(true) == null || !angular.isDefined(this.enemies.getFirstExists(true))) {
                        for (var i = 0; i < 5; ++i) {
                            var enemy = this.enemies.getFirstExists(false);
                            var x = this.game.width + (enemy.width * i), y = this.game.height - enemy.height, velX = -130, velY = 0;

                            enemy.reset(x, y);
                            enemy.body.velocity.x = velX;
                            enemy.body.velocity.y = velY;
                            enemy.body.collideWorldBounds = false;
                        }
                    }
                    this.enemies.forEachExists(function (e) {
                        if (!e.body.collideWorldBounds) {
                            if (e.x >= 0 &&
                                e.x <= (this.game.width - e.width) &&
                                e.y >= 0 &&
                                e.y <= (this.game.height - e.height)
                            ) {
                                e.body.collideWorldBounds = true;
                            }

                        }
                    }, this);
                    this.game.physics.arcade.overlap(this.arrows, this.enemies, this.arrowHitsEnemy, null, this);
                    this.game.physics.arcade.overlap(this.players, this.enemies, this.enemyHitsPlayer, null, this);
                    this.updateWorldShadowAndLights();
                },
                render: function () {
                    if (this.DEBUG) {
                        this.game.debug.cameraInfo(this.game.camera, 10, 20);
                        angular.forEach(this.players.children, function (p, index) {
                            this.game.debug.spriteInfo(p, index * 350, 100);
                            this.game.debug.body(p);
                        }, this);
                        angular.forEach(this.arrows.children, function (a) {
                            this.game.debug.body(a);
                        }, this);
                        angular.forEach(this.enemies.children, function (a) {
                            this.game.debug.body(a);
                        }, this);
                    }
                },
                //  Phaser state functions - end

                //  Creation functions - begin
                createPlayerHelper: function (x, y) {
                    var player = this.players.create(x, y, 'player');
                    player.body.collideWorldBounds = false;  // compute it instead for consistent formation
                    player.body.debug = this.DEBUG;
                    // TODO - real height
                    player.height = 32;
                    player.width = 32;
                    player.invulnerable = false;
                    this.playerTween.push(this.game.add.tween(player));
                    return player;
                },
                createPlayerGroup: function () {
                    this.playerTween = [];
                    this.players = this.game.add.group();
                    this.players.enableBody = true;
                    this.players.physicsBodyType = Phaser.Physics.ARCADE;
                    var x = this.PLAYER_START_X;
                    var y = this.PLAYER_START_Y;
                    for (var i = 0; i < this.PLAYER_HELPERS; ++i) {
                        this.createPlayerHelper(x, y);
                    }
                    this.game.camera.follow(this.players.children[0]);
                    //  TODO
                    this.switchFormation(undefined, this.CURRENT_FORMATION);
                },
                createArrowGroup: function () {
                    this.arrows = this.game.add.group();
                    this.arrows.enableBody = true;
                    this.arrows.physicsBodyType = Phaser.Physics.ARCADE;
                    this.arrows.createMultiple(50, 'arrow');
                    this.arrows.setAll('checkWorldBounds', true);
                    this.arrows.setAll('body.debug', this.DEBUG);
                    this.arrows.setAll('anchor.x', 0.5);
                    this.arrows.setAll('anchor.y', 1.0);
                    this.arrows.setAll('outOfBoundsKill', true);
                    this.arrows.setAll('height', 5);
                    this.arrows.setAll('width', 5);
                },
                createEnemies: function () {
                    this.enemies = this.game.add.group();
                    this.enemies.enableBody = true;
                    this.enemies.physicsBodyType = Phaser.Physics.ARCADE;
                    this.enemies.createMultiple(50, 'demon');
                    this.enemies.setAll('checkWorldBounds', false);
                    this.enemies.setAll('body.debug', this.DEBUG);
                    this.enemies.setAll('anchor.x', 0.5);
                    this.enemies.setAll('anchor.y', 1.0);
                    this.enemies.setAll('outOfBoundsKill', false);
                    this.enemies.setAll('height', 32);
                    this.enemies.setAll('width', 32);
                    this.enemies.setAll('body.height', 32);
                    this.enemies.setAll('body.width', 32);
                    this.enemies.setAll('body.collideWorldBounds', false);
                    this.enemies.setAll('body.bounce.x', 1);
                    this.enemies.setAll('body.bounce.y', 1);
                },
                initializeWorldShadowing: function () {
                    this.shadowTexture = this.game.add.bitmapData(this.game.world.width * 2, this.game.world.height * 2);
                    this.lightSprite = this.game.add.image(0, 0, this.shadowTexture);
                    this.lightSprite.blendMode = Phaser.blendModes.MULTIPLY;
                },
                initializeKeyboard: function () {
                    this.cursors = this.game.input.keyboard.createCursorKeys();
                    this.formationKeys = [];
                    this.formationKeys.push(this.game.input.keyboard.addKey(Phaser.Keyboard.ONE));
                    this.formationKeys.push(this.game.input.keyboard.addKey(Phaser.Keyboard.TWO));
                    this.formationKeys.push(this.game.input.keyboard.addKey(Phaser.Keyboard.THREE));
                    this.formationKeys.push(this.game.input.keyboard.addKey(Phaser.Keyboard.FOUR));
                    angular.forEach(this.formationKeys, function (key, index) {
                        key.onUp.add(this.switchFormation, this, 100, index + 1);
                    }, this);
                    this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onUp.add(this.fireArrows, this);
                },
                initializeArrowTracker: function () {
                    if (this.ARROWS_REMAINING > 0) {
                        var textStyle = {
                            font: '10px Arial',
                            fill: '#FF9329',
                            align: 'left'
                        };
                        this.arrowText = this.game.add.text(0, 0, this.makeArrowText(), textStyle);
                        this.arrowText.fixedToCamera = true;
                        this.arrowText.cameraOffset.setTo(0, 0);
                    }
                },
                //  Creation functions - end

                //  Arrow related - begin
                makeArrowText: function () {
                    return 'Arrows: ' + this.ARROWS_REMAINING;
                },

                drawCircleOfLight: function (sprite, lightRadius) {
                    var radius = lightRadius + this.game.rnd.integerInRange(1, 10);
                    var gradient = this.shadowTexture.context.createRadialGradient(
                        sprite.x, sprite.y, lightRadius * 0.25,
                        sprite.x, sprite.y, radius);
                    gradient.addColorStop(0, 'rgba(225, 225, 225, 0.5)');
                    gradient.addColorStop(1, 'rgba(225, 225, 225, 0.0)');

                    this.shadowTexture.context.beginPath();
                    this.shadowTexture.context.fillStyle = gradient;
                    this.shadowTexture.context.arc(sprite.x, sprite.y, radius, 0, Math.PI * 2, false);
                    this.shadowTexture.context.fill();
                },
                updateWorldShadowAndLights: function () {
                    //  TODO - make a gamma slider  (10, 20,50)

                    this.shadowTexture.context.fillStyle = 'rgb(60, 80, 110)';
                    this.shadowTexture.context.fillRect(0, 0, this.game.world.width, this.game.world.height);

                    angular.forEach(this.players.children, function (p) {
                        this.drawCircleOfLight(p, this.PLAYER_LIGHT_RADIUS);
                    }, this);
                    this.shadowTexture.dirty = true;
                },
                //  Candle related -end

                //  Player action and movement - begin
                fireArrows: function () {
                    if (this.game.time.now > this.NEXT_FIRE_TIME) {
                        if (this.ARROWS_REMAINING > 0) {
                            if (angular.isDefined(this.NEXT_FIRE_TIME))
                                angular.forEach(this.players.children, function (p, index) {
                                    if (p.alive) {
                                        var arrow = this.arrows.getFirstExists(false);
                                        var x = 0, y = 0, velX = 0, velY = 0;

                                        switch (this.CURRENT_FORMATION) {
                                            case VERTICAL_FORMATION:
                                                if (index < 3) {
                                                    x = p.x;
                                                    y = p.y + (p.height / 2);
                                                    velX = -this.PLAYER_ARROW_VELOCITY;
                                                } else {
                                                    x = p.x + p.width;
                                                    y = p.y + (p.height / 2);
                                                    velX = this.PLAYER_ARROW_VELOCITY;
                                                }
                                                break;
                                            case HORIZONTAL_FORMATION:
                                                switch (index) {
                                                    case 0:
                                                    case 3:
                                                    case 4:
                                                        x = p.x + (p.width / 2);
                                                        y = p.y;
                                                        velY = -this.PLAYER_ARROW_VELOCITY;
                                                        break;
                                                    case 1:
                                                    case 2:
                                                    case 5:
                                                        x = p.x + (p.width / 2);
                                                        y = p.y + p.height;
                                                        velY = this.PLAYER_ARROW_VELOCITY;
                                                        break;
                                                }
                                                break;
                                            case WEDGE_FORMATION:
                                                x = p.x + p.width;
                                                y = p.y + (p.height / 2);
                                                velX = this.PLAYER_ARROW_VELOCITY;
                                                break;
                                            case BLOCK_FORMATION:
                                                switch (index) {
                                                    case 0:
                                                    case 3:
                                                        x = p.x + (p.width / 2);
                                                        y = p.y;
                                                        velY = -this.PLAYER_ARROW_VELOCITY;
                                                        break;
                                                    case 4:
                                                        x = p.x + p.width;
                                                        y = p.y + (p.height / 2);
                                                        velX = this.PLAYER_ARROW_VELOCITY;
                                                        break;
                                                    case 1:
                                                        x = p.x;
                                                        y = p.y + (p.height / 2);
                                                        velX = -this.PLAYER_ARROW_VELOCITY;
                                                        break;
                                                    case 2:
                                                    case 5:
                                                        x = p.x + (p.width / 2);
                                                        y = p.y;
                                                        velY = this.PLAYER_ARROW_VELOCITY;
                                                        break;
                                                }
                                                break;
                                        }
                                        arrow.reset(x, y);
                                        arrow.body.velocity.x = velX;
                                        arrow.body.velocity.y = velY;
                                    }
                                }, this);
                            this.ARROWS_REMAINING = this.ARROWS_REMAINING - 1;
                            this.NEXT_FIRE_TIME = this.game.time.now += this.PLAYER_FIRE_FREQUENCY;
                            this.arrowText.text = this.makeArrowText();
                            if (this.ARROWS_REMAINING === 0) {
                                this.failure();
                            }
                        } else {
                            // TODO
                        }
                    }
                },
                switchFormation: function (event, formation) {
                    this.CURRENT_FORMATION = formation;
                    //  TODO - ROTATE PLAYERS?
                    this.moveHelpers();
                },
                revivePlayer: function (state) {
                    var dead = state.players.getFirstDead();
                    if (dead !== null && angular.isDefined(dead)) {
                        dead.reset(0, 0);
                        dead.invulnerable = true;
                        //  TODO - sound, make invulnerable visible
                        $timeout(state.makeVulnerable, state.PLAYER_INVULNERABLE_RATE, true, dead);
                        state.moveHelpers();
                    }
                    $timeout(state.revivePlayer, state.PLAYER_REVIVE_RATE, true, state);
                },
                makeVulnerable: function (player) {
                    //  TODO - show
                    player.invulnerable = false;
                },
                handlePlayerMovement: function () {
                    var moved = false;
                    //  This gives time for tweens to run
                    if (angular.isUndefined(this.movedLast)) {
                        this.movedLast = false;
                    }
                    if (!this.movedLast) {
                        if (this.cursors.up.isDown) {
                            angular.forEach(this.players.children, function (player) {
                                player.y -= this.PLAYER_MOVE_SPEED;
                            }, this);
                            //this.players.children[0].y -= this.PLAYER_MOVE_SPEED;
                            moved = true;
                        }
                        if (this.cursors.down.isDown) {
                            angular.forEach(this.players.children, function (player) {
                                player.y += this.PLAYER_MOVE_SPEED;
                            }, this);
                            //this.players.children[0].y += this.PLAYER_MOVE_SPEED;
                            moved = true;
                        }
                        if (this.cursors.left.isDown) {
                            angular.forEach(this.players.children, function (player) {
                                player.x -= this.PLAYER_MOVE_SPEED;
                            }, this);

                            //this.players.children[0].x -= this.PLAYER_MOVE_SPEED;
                            moved = true;
                        }
                        if (this.cursors.right.isDown) {
                            angular.forEach(this.players.children, function (player) {
                                player.x += this.PLAYER_MOVE_SPEED;
                            }, this);
                            //this.players.children[0].x += this.PLAYER_MOVE_SPEED;
                            moved = true;
                        }
                        if (moved) {
                            this.moveHelpers();
                            this.movedLast = true;
                        }
                    } else {
                        this.movedLast = false;
                    }
                },
                moveHelpers: function () {
                    angular.forEach(this.players.children,
                        function (p, index) {
                            if (p.alive) {
                                var x = this.players.children[0].x, y = this.players.children[0].y;
                                switch (this.CURRENT_FORMATION) {
                                    case VERTICAL_FORMATION:
                                        if (index < 3) {
                                            y += (index * p.height);
                                        } else {
                                            x += p.width;
                                            y += ((index - 3) * p.height);
                                        }
                                        break;
                                    case HORIZONTAL_FORMATION:
                                        switch (index) {
                                            case 0:
                                                break;
                                            case 3:
                                                x += p.width;
                                                break;
                                            case 4:
                                                x += (p.width * 2);
                                                break;
                                            case 1:
                                                y += p.height;
                                                break;
                                            case 2:
                                                x += p.width;
                                                y += p.height;
                                                break;
                                            case 5:
                                                x += (p.width * 2);
                                                y += p.height;
                                                break;
                                        }
                                        break;
                                    case BLOCK_FORMATION:
                                        switch (index) {
                                            case 0:   //  upper left
                                                break;
                                            case 1:   //mid left
                                                y += (p.height / 2);
                                                x += p.width;
                                                break;
                                            case 2:   // lower left
                                                y += p.height;
                                                break;
                                            case 3:  // upper right
                                                x += (p.width * 3);
                                                break;
                                            case 4:  // mid right
                                                y += (p.height / 2);
                                                x += (p.width * 2);
                                                break;
                                            case 5:  // lower right
                                                y += p.height;
                                                x += (p.width * 3);
                                                break;
                                        }
                                        break;
                                    case WEDGE_FORMATION:
                                        switch (index) {
                                            case 0:   //  upper left
                                                break;
                                            case 1:   //  back left
                                                y += (p.height * 2);
                                                break;
                                            case 2:   //  lower left
                                                y += (p.height * 4);
                                                break;
                                            case 3:   //  mid upper
                                                x += p.width;
                                                y += p.height;
                                                break;
                                            case 4:   // wedge point
                                                y += (p.height * 2);
                                                x += (p.width * 2);
                                                break;
                                            case 5:   // mid lower
                                                y += (p.height * 3);
                                                x += p.width;
                                                break;
                                        }
                                        break;
                                }

                                var adjustX = 0, adjustY = 0;
                                if (x < 0) {
                                    adjustX = -x;
                                } else if ((x + p.width) > this.game.width) {
                                    adjustX = this.game.width - x - p.width;
                                }
                                if (y < 0) {
                                    adjustY = -y;
                                } else if ((y + p.height) > this.game.height) {
                                    adjustY = this.game.height - y - p.height;
                                }
                                if (adjustX !== 0 || adjustY !== 0) {
                                    this.players.children[0].x += adjustX;
                                    this.players.children[0].y += adjustY;
                                    this.moveHelpers();
                                } else {
                                    var x2 = Math.pow((p.x - x), 2);
                                    var y2 = Math.pow((p.y - y), 2);
                                    var distanceFactor = Math.floor(Math.sqrt(x2 + y2) / this.PLAYER_MOVE_SPEED);
                                    var tween = this.playerTween[index];
                                    tween.stop();
                                    tween = this.game.add.tween(p);
                                    this.playerTween[index] = tween;
                                    tween.to({
                                        x: x,
                                        y: y
                                    }, 8 * distanceFactor, null, true);
                                }
                            }
                        }, this)
                },
//  Player action and movement - end

//  collision handlers
                arrowHitsEnemy: function (arrow, enemy) {
                    arrow.kill();
                    enemy.kill();
                }
                ,
                enemyHitsPlayer: function (player) {
                    if (!player.invulnerable) {
                        player.kill();
                        //  TODO - death tween
                        //  TODO - all players dead
                    }
                },
//  Ending related
                failure: function () {
                    this.game.ending = true;
                    var deathTween = this.game.add.tween(this);
                    deathTween.to({PLAYER_LIGHT_RADIUS: 0}, 1000, Phaser.Easing.Power1, true);
                },

                winEnding: function () {
                    this.game.ending = true;
                    var winTween = this.game.add.tween(this);
                    winTween.to({PLAYER_LIGHT_RADIUS: 100}, 1000, Phaser.Easing.Power1, true);
                    winTween.onComplete.add(function () {
                        //  TODO - End of Act
                        //  TODO - interludes
                        //  TODO - retry move on option
                        //  TODO - add arrows?
                        this.game.state.start(this.state.current, true, false, this.LEVEL + 1, this.ARROWS_REMAINING);
                    }, this);
                }
            }
                ;
        }
    ]
)
;
