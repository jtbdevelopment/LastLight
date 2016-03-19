'use strict';

angular.module('uiApp').factory('TitleScreenState',
    ['Phaser',
        function (Phaser) {
            var titleScreen = {
                game: undefined,
                load: undefined,
                data: undefined,
                state: undefined,

                DEBUG: false,

                preload: function () {
                },

                create: function () {
                    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
                    //  TODO - make a flame for i dot
                    this.text = this.game.add.text(this.world.centerX, this.world.centerY, "Last Light");
                    this.text.anchor.setTo(0.5);
                    this.text.font = 'Revalia';
                    this.text.fontSize = 80;
                    this.text.align = 'center';
                    this.text.stroke = '#000000';
                    this.text.strokeThickness = 5;
                    var gradient = this.text.context.createLinearGradient(0, this.text.canvas.height / 2, 0, this.text.canvas.height * 2);
                    gradient.addColorStop(0, '#FFD6AA');
                    gradient.addColorStop(1, '#FF9329');
                    this.text.fill = gradient;
                    this.shadowTexture = this.game.add.bitmapData(this.game.world.width, this.game.world.height);
                    this.lightSprite = this.game.add.image(this.game.camera.x, this.game.camera.y, this.shadowTexture);
                    this.lightSprite.blendMode = Phaser.blendModes.MULTIPLY;
                    this.shadowTexture.context.fillStyle = 'rgb(10, 10, 10)';
                    this.shadowTexture.context.fillRect(0, 0, this.game.world.width, this.game.world.height);
                    this.lightRadius = 400;
                    this.game.input.keyboard.addCallbacks(this, undefined, undefined, this.moveOn);
                    this.game.input.onTap.add(this.moveOn, this);
                },

                update: function () {
                    if (this.lightRadius > 12) {
                        this.lightRadius -= 1;
                        this.shadowTexture.context.fillStyle = 'rgb(1, 1, 1)';
                        this.shadowTexture.context.fillRect(0, 0, this.game.world.width, this.game.world.height);
                        var x = this.world.centerX + 81;
                        var y = this.world.centerY - 24;
                        var radius = this.lightRadius + this.game.rnd.integerInRange(1, 10);
                        var gradient = this.shadowTexture.context.createRadialGradient(
                            x, y, this.lightRadius * 0.25,
                            x, y, radius);
                        gradient.addColorStop(0, 'rgba(225, 225, 225, 1.0)');
                        gradient.addColorStop(1, 'rgba(225, 225, 225, 0.0)');

                        this.shadowTexture.context.beginPath();
                        this.shadowTexture.context.fillStyle = gradient;
                        this.shadowTexture.context.arc(x, y, radius, 0, Math.PI * 2, false);
                        this.shadowTexture.context.fill();
                        this.shadowTexture.dirty = true;

                    } else {
                        this.moveOn();
                    }
                },

                moveOn: function () {
                    //  TODO - go to picker/levels etc
                    this.game.state.start('Interlude', true, false, 'StartInterlude');
                }
            };

            return titleScreen;
        }
    ]
);
