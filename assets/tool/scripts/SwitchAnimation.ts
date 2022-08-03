
import { _decorator, Component, resources, AnimationClip, SkeletalAnimation, CCString, Label } from 'cc';
import DropDown from '../dropdown/scripts/DropDown';
const { ccclass, property } = _decorator;

@ccclass('SwitchAnimation')
export class SwitchAnimation extends Component {
    @property(Label) private title: Label;
    @property(CCString) private directory: string;
    @property(DropDown) private dropDownSingleAnim!: DropDown;
    @property(SkeletalAnimation) private skeletonAnim!: SkeletalAnimation;

    start() {
        this.title.string = this.directory;
        resources.loadDir(this.directory, (err, data) => {
            if (err) {
                console.error("Load " + this.directory + " animation fail: ", err);
                return;
            }

            this.skeletonAnim.clips = data.filter(i => i instanceof AnimationClip).map(i => <AnimationClip>i);
            this.dropDownSingleAnim.setOptionDatas(this.skeletonAnim.clips.map(i => i.name));
        })
    }

    play() {
        this.skeletonAnim.play(this.dropDownSingleAnim.selectedString);
    }
}