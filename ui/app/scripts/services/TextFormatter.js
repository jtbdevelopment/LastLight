'use strict';

angular.module('uiApp').factory('TextFormatter',
    [
        function () {
            var textFormatter = {
                formatTracker: function (text) {
                    this.noFillFormatText(text);
                    text.fixedToCamera = true;
                    text.cameraOffset.setTo(3, 0);
                    text.font = 'Lora';
                },
                formatText: function (text) {
                    this.noFillFormatText(text);
                    var gradient = text.context.createLinearGradient(0, 0, 0, text.canvas.height);
                    gradient.addColorStop(0, '#FFD6AA');
                    gradient.addColorStop(1, '#FF9329');
                    text.fill = gradient;
                },
                noFillFormatText: function (text) {
                    text.anchor.setTo(0.0);
                    text.font = 'Berkshire Swash';
                    text.fontSize = 12;
                    text.align = 'left';
                    text.strokeThickness = 1;
                    text.fill = '#f0b904';
                }

            };

            return textFormatter;
        }
    ]
);
