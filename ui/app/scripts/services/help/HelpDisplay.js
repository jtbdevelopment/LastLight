'use strict';

angular.module('uiApp').factory('HelpDisplay',
    ['Phaser',
        function (Phaser) {
            var helpDisplay = {
                show: false,

                initializeHelp: function (state, helpText, show) {
                    this.show = true;
                    this.state = state;
                    state.helpText = state.game.add.text(state.game.world.centerX, state.game.world.centerY, helpText);
                    state.helpText.anchor.setTo(0.5);
                    state.helpText.font = 'Revalia';
                    state.helpText.fontSize = 18;
                    state.helpText.align = 'center';
                    state.helpText.stroke = '#000000';
                    state.helpText.strokeThickness = 5;
                    var gradient = state.helpText.context.createLinearGradient(0, 0, 0, state.game.world.height);
                    gradient.addColorStop(0, '#FFD6AA');
                    gradient.addColorStop(1, '#FF9329');
                    state.helpText.fill = gradient;
                    if (show === false) {
                        this.toggleText();
                    } else {
                        state.game.time.events.repeat(8000, 1, this.turnOffTextTimeout, this)
                    }
                    state.game.input.keyboard.addKey(Phaser.Keyboard.QUESTION_MARK).onUp.add(this.toggleText, this);
                },

                turnOffTextTimeout: function () {
                    if (this.show === true) {
                        this.toggleText();
                    }
                },

                toggleText: function () {
                    this.show = !this.show;
                    if (this.show === false) {
                        this.state.helpText.kill();
                    } else {
                        this.state.helpText.reset(this.state.game.world.centerX, this.state.game.world.centerY);
                    }
                }
            };

            return helpDisplay;
        }]);
