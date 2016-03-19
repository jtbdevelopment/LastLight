'use strict';

angular.module('uiApp').factory('HelpDisplay',
    ['Phaser', 'TextFormatter',
        function (Phaser, TextFormatter) {
            var helpDisplay = {
                show: false,

                initializeHelp: function (state, helpText, show) {
                    this.show = true;
                    this.state = state;
                    state.helpText = state.game.add.text(state.game.camera.view.centerX, state.game.camera.view.centerY, helpText);
                    TextFormatter.formatText(state.helpText);
                    state.helpText.anchor.setTo(0.5);
                    state.helpText.fixedToCamera = true;
                    state.helpText.cameraOffset.setTo(state.game.camera.view.centerX, state.game.camera.view.centerY);
                    state.helpText.fontSize = 18;
                    state.helpText.align = 'center';
                    if (show === false) {
                        this.toggleText();
                    } else {
                        state.game.time.events.add(8000, this.turnOffTextTimeout, this);
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
