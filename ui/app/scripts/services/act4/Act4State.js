'use strict';

angular.module('uiApp').factory('Act4State',
    ['$timeout', 'Phaser',
        function ($timeout, Phaser) {
            return {
                game: undefined,
                load: undefined,
                data: undefined,
                state: undefined,

                DEBUG: false,
                MAX_ZOOM: 1.0,
                MIN_ZOOM: 0.50,
                ZOOM_STEP: 0.01,
                INITIAL_FOG_HEALTH: 100000,
                TOTAL_TIME: 20, // minutes

                SUN_HIT_PRECISION: 5,

                //  Phaser state functions - begin
                init: function () {
                    //  TODO - checkpoint
                    //  TODO - minimap
                },
                preload: function () {
                    //  Note tile asset IDs do not match because 0 represents no tile
                    //  So in tiled - a tile will be asset id 535
                    //  In json file it will be 536
                    //  When remapping images from one to another you would need to say 536 -> 535
                    this.load.tilemap('tilemap', 'assets/tilemaps/act4.json', null, Phaser.Tilemap.TILED_JSON);

                    //  TODO - actual art
                    //  TODO - physics for art
                    //  https://code.google.com/p/box2d-editor/
                    //  http://phaser.io/examples/v2/p2-physics/load-polygon-1
                    //  TODO - real boundary layer ?
                    //  TODO - music
                    this.load.spritesheet('hyptosis_tile-art-batch-1', 'images/hyptosis_tile-art-batch-1.png', 32, 32);
                    this.load.spritesheet('hyptosis_tile-art-batch-2', 'images/hyptosis_tile-art-batch-2.png', 32, 32);
                    this.load.spritesheet('hyptosis_tile-art-batch-3', 'images/hyptosis_tile-art-batch-3.png', 32, 32);
                    this.load.image('lens-center', 'images/LightOrb.png');
                    this.load.image('sun', 'images/LightStar.png');
                    this.load.image('ally', 'images/act4ally.png');
                    this.load.image('enemy', 'images/act4enemy.png');
                },
                create: function () {
                    this.tileHits = [];
                    this.game.ending = false;
                    this.scale = this.MIN_ZOOM;
                    this.lastScale = 0;
                    this.fogHealth = this.INITIAL_FOG_HEALTH;
                    this.fogHealthPercent = 1.0;

                    var map = this.createTileMap();

                    this.game.physics.startSystem(Phaser.Physics.ARCADE);
                    this.game.physics.arcade.setBoundsToWorld(true, true, true, true, false);
                    this.createSun();
                    this.createAllies();
                    this.createPlayer();
                    this.initializeKeyboard();
                    this.initializeWorldShadowing();
                    this.initializeFogHealthText();
                    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
                    this.game.camera.follow(this.focusFire);
                },

                clearTileHitDisplay: function () {
                    if (this.state.DEBUG) {
                        angular.forEach(this.tileHits, function (tileHit) {
                            tileHit.debug = false;
                        });
                        this.blockLayer.dirty = this.tileHits.length > 0;
                    }
                    this.tileHits = [];
                },
                addTileHitsToDisplay: function (moreTileHits) {
                    this.tileHits = this.tileHits.concat(moreTileHits);
                },
                showTileHitsDisplay: function () {
                    if (this.DEBUG) {
                        angular.forEach(this.tileHits, function (tileHit) {
                            tileHit.debug = this.DEBUG;
                        }, this);
                        this.blockLayer.dirty = this.tileHits.length > 0;
                    }
                },
                update: function () {
                    //this.player.body.setZeroVelocity();
                    this.clearTileHitDisplay();
                    if (!this.game.ending) {
//                        this.enemyGroup.forEach(function (enemy) {
//                            enemy.updateFunction(this.player);
//                        }, this);
                        this.handleZoomChange();
                        this.handlePlayerMovement();
                        this.checkLensHits();
                        this.fogHealthPercent = this.fogHealth / this.INITIAL_FOG_HEALTH;
                        this.fogHealthText.text = this.makeFogHealthText();
                        this.showTileHitsDisplay();
                        this.updateWorldShadowAndLights();
                    } else {
//                        this.enemyGroup.forEach(function (enemy) {
//                            enemy.body.setZeroVelocity();
//                        });
                    }
                },
                render: function () {
                    if (this.DEBUG) {
                        this.game.debug.cameraInfo(this.game.camera, 0, 20);
                        this.game.debug.spriteInfo(this.focusFire, 400, 20);
                        /*
                         angular.forEach(this.enemyGroup.children, function (child, index) {
                         this.game.debug.spriteInfo(child, index * 350, 100);
                         }, this);
                         angular.forEach(this.movableGroup.children, function (child, index) {
                         this.game.debug.spriteInfo(child, index * 350, 200);
                         }, this);
                         */
                    }
                },
                //  Phaser state functions - end

                //  Creation functions - begin
                createTileMap: function () {
                    var map = this.game.add.tilemap('tilemap');
                    map.addTilesetImage('hyptosis_tile-art-batch-1');
                    map.addTilesetImage('hyptosis_tile-art-batch-2');
                    map.addTilesetImage('hyptosis_tile-art-batch-3');

                    this.pathLayer = map.createLayer('Path Layer');
                    this.blockLayer = map.createLayer('Block Layer');
                    this.blockLayer.debug = this.DEBUG;
                    this.blockLayer.resizeWorld();
                    var tileIds = [];
                    this.blockLayer.layer.data.forEach(function (layerRow) {
                        layerRow.forEach(function (layerCell) {
                            if (layerCell.index > 0) {
                                if (tileIds.indexOf(layerCell.index) < 0) {
                                    tileIds.push(layerCell.index);
                                }
                            }
                        });
                    });
                    tileIds = tileIds.sort();
                    map.setCollision(tileIds, true, this.blockLayer);
                    return map;
                },
                createAllies: function () {
                    this.alliesGroup = this.game.add.physicsGroup();

                    //this.alliesGroup.classType =
                    this.alliesGroup.createMultiple(160, 'ally');
                    this.alliesGroup.setAll('checkWorldBounds', true);
                    this.alliesGroup.setAll('body.debug', this.DEBUG);
                    this.alliesGroup.setAll('anchor.x', 0.0);
                    this.alliesGroup.setAll('anchor.y', 0.0);
                    this.alliesGroup.setAll('outOfBoundsKill', false);
                    this.alliesGroup.setAll('body.collideWorldBounds', false);
                    this.alliesGroup.setAll('body.bounce.x', 1);
                    this.alliesGroup.setAll('body.bounce.y', 1);
                    this.alliesGroup.setAll('state', this);
                    this.alliesGroup.setAll('height', 15);
                    this.alliesGroup.setAll('width', 15);
                    this.alliesGroup.setAll('body.height', 15);
                    this.alliesGroup.setAll('body.width', 15);

                    for (var i = 0; i < 8; ++i) {
                        var baseX = (360 + 720 * i) - (32 * 3);
                        var baseY = 600 - 32;
                        if(i === 2 || i === 4 || i === 7) {
                            baseY = 320 -32;
                        }
                        for (var j = 0; j < 20; ++j) {
                            var x = baseX + this.game.rnd.integerInRange(0, 32 * 3);
                            var y = baseY + this.game.rnd.integerInRange(0, 32 * 3);
                            var ally = this.alliesGroup.getFirstExists(false);
                            ally.reset(x, y);
                        }
                    }
                },
                createPlayer: function () {
                    this.playerGroup = this.game.add.group();

                    this.focusFire = this.game.add.sprite(this.game.world.width / 2, 20, 'lens-center');
                    this.focusFire.height = 16;
                    this.focusFire.width = 16;
                    this.playerGroup.add(this.focusFire);
                },
                createSun: function () {
                    //  TODO - will be problem when checkpointing
                    this.sunGroup = this.game.add.group();

                    this.sun = this.game.add.sprite(this.game.world.width, 230, 'sun');
                    this.sun.height = 24;
                    this.sun.width = 24;
                    this.sunGroup.add(this.sun);
                    var totalTime = this.TOTAL_TIME * 60 * 1000;
                    this.sunTweens = [];
                    this.sunTweens.push(this.game.add.tween(this.sun).to({x: 0 - this.sun.width},totalTime, Phaser.Easing.Linear.None, false));
                    this.sunTweens.push(this.game.add.tween(this.sun).to({y: 10}, totalTime / 2, Phaser.Easing.Quartic.Out, false));
                    this.sunTweens.push(this.game.add.tween(this.sun).to({y: 230}, totalTime / 2, Phaser.Easing.Quartic.In, false));
                    this.sunTweens[1].chain(this.sunTweens[2]);
                    this.sunTweens[0].start();
                    this.sunTweens[1].start();
                },

                createEnemies: function (map) {
                    this.enemyGroup = this.game.add.physicsGroup(Phaser.Physics.ARCADE);
                    map.createFromObjects('Object Layer ' + this.level, 782, 'demon', 0, true, false, this.enemyGroup, this.levelData.patrolEnemyClass, false);
                    this.enemyGroup.forEach(function (enemy) {
                        enemy.state = this;
                        enemy.settings = Act1Settings;
                        enemy.body.setMaterial(this.enemyMaterial);
                        enemy.initialize();
                    }, this);
                },

                initializeWorldShadowing: function () {
                    this.shadowTexture = this.game.add.bitmapData(this.game.world.width, this.game.world.height);
                    this.lightSprite = this.game.add.image(this.game.camera.x, this.game.camera.y, this.shadowTexture);
                    this.lightSprite.blendMode = Phaser.blendModes.MULTIPLY;
                },

                initializeKeyboard: function () {
                    this.cursors = this.game.input.keyboard.createCursorKeys();
                    this.altKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ALT);
                    this.zoomIn = this.game.input.keyboard.addKey(Phaser.Keyboard.X);
                    this.zoomOut = this.game.input.keyboard.addKey(Phaser.Keyboard.Z);
                },

                initializeFogHealthText: function () {
                    var textStyle = {
                        font: '10px Arial',
                        fill: '#FF9329',
                        align: 'left'
                    };
                    this.fogHealthText = this.game.add.text(0, 0, '', textStyle);
                    this.fogHealthText.fixedToCamera = true;
                    this.fogHealthText.cameraOffset.setTo(0, 0);
                },
                //  Creation functions - end

                //  Light related - begin
                makeFogHealthText: function () {
                    return 'Fog: ' + Math.floor(this.fogHealthPercent * 100) + '%';
                },

                fogHealthTimeoutHandler: function (state) {
                    if (state.game.ending) {
                        return;
                    }
                    state.currentCandleTime -= 1;
                    if (state.currentCandleTime === 0) {
                        if (state.currentCandles > 1) {
                            if (state.player.isHiding) {
                                state.deathEnding();
                            } else {
                                //  TODO - play match type sound?
                                state.currentCandles -= 1;
                                state.currentCandleTime = Act1Settings.TIME_PER_CANDLE;
                            }
                        }
                    }
                    state.fogHealthText.text = state.makeCandleText();
                    if (state.currentCandles > 0 || state.currentCandleTime > 0) {
                        $timeout(state.fogHealthTimeoutHandler, 1000, true, state);
                    } else {
                        state.deathEnding();
                    }
                },

                drawCircleOfLight: function (sprite, lightRadius, maxBrightness) {
                    var radius = lightRadius + this.game.rnd.integerInRange(1, 10);
                    var x = (sprite.x + (sprite.width / 2)) * this.scale;
                    var y = (sprite.y + (sprite.height / 2)) * this.scale;
                    var gradient = this.shadowTexture.context.createRadialGradient(
                        x, y, lightRadius * 0.25,
                        x, y, radius);
                    gradient.addColorStop(0, 'rgba(255, 255, 255, ' + maxBrightness + ')');
                    gradient.addColorStop(1, 'rgba(255, 255, 200, 0.0)');

                    this.shadowTexture.context.beginPath();
                    this.shadowTexture.context.fillStyle = gradient;
                    this.shadowTexture.context.arc(x, y, radius, 0, Math.PI * 2, false);
                    this.shadowTexture.context.fill();
                },

                updateWorldShadowAndLights: function () {
                    //  TODO - make this scale as we go
                    var darknessScale = Math.floor(255 - (175 * this.fogHealthPercent));
                    this.shadowTexture.context.fillStyle = 'rgb(' + darknessScale +
                        ', ' + darknessScale +
                        ', ' + darknessScale +
                        ')';
                    this.shadowTexture.context.fillRect(0, 0, this.game.world.width, this.game.world.height);

                    this.drawCircleOfLight(this.focusFire, this.focusFire.width * 2, 1.0);
                    this.drawCircleOfLight(this.sun, 1, Math.min(0.1, 1 - this.fogHealthPercent));

                    this.shadowTexture.dirty = true;
                },
                //  Light related - end

                //  Player action and movement - begin
                collisionCheck: function (body) {
                    if (angular.isDefined(body) &&
                        body !== null &&
                        angular.isDefined(body.sprite) &&
                        body.sprite !== null &&
                        angular.isDefined(body.sprite.key)) {
                        switch (body.sprite.parent) {
                            case this.enemyGroup:
                                this.deathEnding();
                                break;
                            case this.finishGroup:
                                this.winEnding();
                                break;
                        }
                    }
                },

                handleZoomChange: function () {
                    if (this.zoomIn.isDown) {
                        this.scale += this.ZOOM_STEP;
                    }
                    if (this.zoomOut.isDown) {
                        this.scale -= this.ZOOM_STEP;
                    }
                    this.scale = Math.min(Math.max(this.MIN_ZOOM, this.scale), this.MAX_ZOOM);
                    //  TODO - zoom enemies
                    if (this.scale !== this.lastScale) {
                        this.blockLayer.scale.setTo(this.scale);
                        this.pathLayer.scale.setTo(this.scale);
                        this.playerGroup.scale.setTo(this.scale);
                        this.alliesGroup.scale.setTo(this.scale);
                        this.sunGroup.scale.setTo(this.scale);
                        this.blockLayer.resize(this.game.scale.width / this.scale, this.game.scale.height / this.scale);
                        this.pathLayer.resize(this.game.scale.width / this.scale, this.game.scale.height / this.scale);
                        this.game.camera.bounds.width = this.game.world.width * this.blockLayer.scale.x;
                        this.game.camera.bounds.height = this.game.world.height * this.blockLayer.scale.y;
                        this.lastScale = this.scale;
                    }
                },

                checkLensHits: function () {
                    if (Math.abs((this.sun.x + this.sun.width / 2) - (this.focusFire.x + this.focusFire.width / 2)) <= this.SUN_HIT_PRECISION &&
                        Math.abs((this.sun.y + this.sun.height / 2) - (this.focusFire.y + this.focusFire.height / 2)) <= this.SUN_HIT_PRECISION) {
                        this.fogHealth -= 1;
                        if (this.fogHealth === 0) {
                            this.winEnding();
                        }
                    }
                },

                handlePlayerMovement: function () {
                    var move;
                    if (!this.altKey.isDown) {
                        move = 50 * this.playerGroup.scale.x;
                        this.game.camera.unfollow();
                        if (this.cursors.up.isDown) {
                            this.game.camera.y -= move;
                        }
                        if (this.cursors.down.isDown) {
                            this.game.camera.y += move;
                        }
                        if (this.cursors.left.isDown) {
                            this.game.camera.x -= move;
                        }
                        if (this.cursors.right.isDown) {
                            this.game.camera.x += move;
                        }
                    } else {
                        this.game.camera.follow(this.focusFire);
                        move = 10 * this.scale;
                        if (this.cursors.up.isDown) {
                            this.focusFire.y -= move;
                        }
                        if (this.cursors.down.isDown) {
                            this.focusFire.y += move;
                        }
                        if (this.cursors.left.isDown) {
                            this.focusFire.x -= move;
                        }
                        if (this.cursors.right.isDown) {
                            this.focusFire.x += move;
                        }
                    }
                }

                ,
                //  Player action and movement - end

                //  Ending related
                deathEnding: function () {
                    this.game.ending = true;
                    var deathTween = this.game.add.tween(this);
                    deathTween.to({playerLightRadius: 0}, 1000, Phaser.Easing.Power1, true);
                    deathTween.onComplete.add(function () {
                        //  TODO - dying off screen doesn't reset cleanly without move
                        this.player.x = this.levelData.startingX;
                        this.player.y = this.levelData.startingY;
                        this.player.kill();
                        //  TODO - retry move on option
                        this.game.state.start(this.state.current, true, false, this.level, this.startingCandles);
                    }, this);
                }
                ,

                winEnding: function () {
                    this.game.ending = true;
                    var winTween = this.game.add.tween(this);
                    winTween.to({playerLightRadius: 100}, 1000, Phaser.Easing.Power1, true);
                    winTween.onComplete.add(function () {
                        //  TODO - End of Act
                        //  TODO - interludes
                        //  TODO - retry move on option
                        this.game.state.start(this.state.current, true, false, this.level + 1, this.currentCandles + this.levelData.addsCandlesAtEnd);
                    }, this);
                }

            };
        }
    ]
)
;
