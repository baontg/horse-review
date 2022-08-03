import { Label } from 'cc';

import { _decorator, Component, Node, EditBox, game, Game, Slider } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('HRTimeScale')
export class HRTimeScale extends Component {
    @property(Label) labelSpeed!: Label;
    @property(Slider) sliderSpeed!: Slider;

    MAX_SPEED: number = 2;

    start() {
        this.sliderSpeed.progress = 0.5;
        this.setTimeScale(this.sliderSpeed.progress * this.MAX_SPEED);
        this.sliderSpeed.node.on('slide', this.onSlide, this);
    }

    private onSlide() {
        this.setTimeScale(this.sliderSpeed.progress * this.MAX_SPEED);
    }

    private setTimeScale(scale: number) {
        this.labelSpeed.string = "Speed = " + this.fixNumber(scale, 3);
        (game as any)._calculateDT = function (now: number) {
            if (!now) now = performance.now();
            this._deltaTime = now > this._startTime ? (now - this._startTime) / 1000 : 0;
            if (this._deltaTime > Game.DEBUG_DT_THRESHOLD) {
                this._deltaTime = this.frameTime / 1000;
            }
            this._startTime = now;
            this._deltaTime *= scale;
            return this._deltaTime;
        };
    }

    private fixNumber(num: any, fixed: any) {
        let re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
        let result = (num).toString().match(re)[0];
        return result;
    }
}