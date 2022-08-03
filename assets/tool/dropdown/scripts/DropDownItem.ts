import { _decorator, Component, Label, Sprite, Toggle } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DropDownItem')
export default class DropDownItem extends Component {
    @property(Label)
    public label: Label = undefined;
    @property(Sprite)
    public sprite: Sprite = undefined;
    @property(Toggle)
    public toggle: Toggle = undefined;
}