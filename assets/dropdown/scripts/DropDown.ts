import DropDownOptionData from "./DropDownOptionData";
import DropDownItem from "./DropDownItem";
import { _decorator, Component, Label, Sprite, js, error, Toggle, instantiate, Node, UITransform } from "cc";

const { ccclass, property } = _decorator;

@ccclass()
export default class DropDown extends Component {
    @property(Node) private template: Node = undefined;
    @property(Label) private labelCaption: Label = undefined;
    @property(Sprite) private spriteCaption: Sprite = undefined;
    @property(Label) private labelItem: Label = undefined;
    @property(Sprite) private spriteItem: Sprite = undefined;

    @property([DropDownOptionData]) private optionDatas: DropDownOptionData[] = [];

    private _dropDown: Node;
    private validTemplate: boolean = false;
    private items: DropDownItem[] = [];
    private isShow: boolean = false;
    private isDefaultSet: boolean = false;

    private _selectedIndex: number = -1;
    public get selectedIndex(): number {
        return this._selectedIndex;
    }
    public set selectedIndex(value: number) {
        this._selectedIndex = value;
        this.refreshShownValue();
    }

    public get selectedString(): string {
        if (this.optionDatas[this.selectedIndex]) {
            return this.optionDatas[this.selectedIndex].optionString;
        }
        return "";
    }

    public addOptionDatas(optionDatas: string[]): void;
    public addOptionDatas(optionDatas: DropDownOptionData[]): void;
    public addOptionDatas(optionDatas: any[]) {
        if (optionDatas && optionDatas.length > 0) {
            if (typeof optionDatas[0] == "string") {
                optionDatas.forEach(data => {
                    const optData = new DropDownOptionData();
                    optData.optionString = data;
                    this.optionDatas.push(optData);
                })
            } else {
                optionDatas.forEach(data => {
                    this.optionDatas.push(data);
                });
            }
            this.refreshShownValue();
        }
    }

    public setOptionDatas(optionDatas: string[]): void;
    public setOptionDatas(optionDatas: DropDownOptionData[]): void;
    public setOptionDatas(optionDatas: any[]) {
        this.optionDatas = [];
        this.addOptionDatas(optionDatas);
    }

    public clearOptionDatas() {
        this.optionDatas = [];
        this.refreshShownValue();
    }

    public setDefaultOption(index: number) {
        this.isDefaultSet = true;
        this.selectedIndex = index;
    }

    public show() {
        if (!this.validTemplate) {
            this.setUpTemplate();
            if (!this.validTemplate) { return; }
        }
        this.isShow = true;

        this._dropDown = this.createDropDownList(this.template);
        this._dropDown.name = "DropDown List";
        this._dropDown.active = true;
        this._dropDown.setParent(this.template.parent);

        let itemTemplate = this._dropDown.getComponentInChildren<DropDownItem>(DropDownItem);
        let content = itemTemplate.node.parent;
        itemTemplate.node.active = true;

        this.items = [];

        for (let i = 0, len = this.optionDatas.length; i < len; i++) {
            let data = this.optionDatas[i];
            let item: DropDownItem = this.addItem(data, i == this.selectedIndex, itemTemplate, this.items);
            if (!item) {
                continue;
            }
            item.toggle.isChecked = i == this.selectedIndex;
            item.toggle.node.on(Toggle.EventType.TOGGLE, this.onSelectedItem, this);
        }
        itemTemplate.node.active = false;

        const contentTF = content.getComponent(UITransform);
        const itemTemplateTF = itemTemplate.getComponent(UITransform);
        contentTF.setContentSize(contentTF.width, itemTemplateTF.height * this.optionDatas.length);
    }

    private addItem(data: DropDownOptionData, selected: boolean, itemTemplate: DropDownItem, dropDownItems: DropDownItem[]): DropDownItem {
        let item = this.createItem(itemTemplate);
        item.node.setParent(itemTemplate.node.parent);
        item.node.active = true;
        item.node.name = `item_${this.items.length + data.optionString ? data.optionString : ""}`;
        if (item.toggle) {
            item.toggle.isChecked = false;
        }
        if (item.label) {
            item.label.string = data.optionString;
        }
        if (item.sprite) {
            item.sprite.spriteFrame = data.optionSf;
            item.sprite.enabled = data.optionSf != undefined;
        }
        this.items.push(item);
        return item;
    }

    public hide() {
        this.isShow = false;
        if (this._dropDown != undefined) {
            this.delayedDestroyDropdownList(0.15);
        }
    }

    private async delayedDestroyDropdownList(delay: number) {
        // await WaitUtil.waitForSeconds(delay);
        // wait delay;
        for (let i = 0, len = this.items.length; i < len; i++) {
            if (this.items[i] != undefined)
                this.destroyItem(this.items[i]);
        }
        this.items = [];
        if (this._dropDown != undefined)
            this.destroyDropDownList(this._dropDown);
        this._dropDown = undefined;
    }

    private destroyItem(item) {

    }

    private setUpTemplate() {
        this.validTemplate = false;

        if (!this.template) {
            error("The dropdown template is not assigned. The template needs to be assigned and must have a child GameObject with a Toggle component serving as the item");
            return;
        }
        this.template.active = true;
        let itemToggle: Toggle = this.template.getComponentInChildren<Toggle>(Toggle);
        this.validTemplate = true;
        if (!itemToggle || itemToggle.node == this.template) {
            this.validTemplate = false;
            error("The dropdown template is not valid. The template must have a child Node with a Toggle component serving as the item.");
        } else if (this.labelItem != undefined && !this.labelItem.node.isChildOf(itemToggle.node)) {
            this.validTemplate = false;
            error("The dropdown template is not valid. The Item Label must be on the item Node or children of it.");
        } else if (this.spriteItem != undefined && !this.spriteItem.node.isChildOf(itemToggle.node)) {
            this.validTemplate = false;
            error("The dropdown template is not valid. The Item Sprite must be on the item Node or children of it.");
        }

        if (!this.validTemplate) {
            this.template.active = false;
            return;
        }
        let item = itemToggle.node.addComponent<DropDownItem>(DropDownItem);
        item.label = this.labelItem;
        item.sprite = this.spriteItem;
        item.toggle = itemToggle;
        item.node = itemToggle.node;

        this.template.active = false;
        this.validTemplate = true;
    }

    private refreshShownValue() {
        if (this.optionDatas.length <= 0) {
            return;
        }
        let data = this.optionDatas[this.clamp(this.selectedIndex, 0, this.optionDatas.length - 1)];
        if (this.labelCaption) {
            if (data && data.optionString) {
                this.labelCaption.string = data.optionString;
            } else {
                this.labelCaption.string = "";
            }
        }
        if (this.spriteCaption) {
            if (data && data.optionSf) {
                this.spriteCaption.spriteFrame = data.optionSf;
            } else {
                this.spriteCaption.spriteFrame = undefined;
            }
            this.spriteCaption.enabled = this.spriteCaption.spriteFrame != undefined;
        }
    }

    protected createDropDownList(template: Node): Node {
        return instantiate(template);
    }

    protected destroyDropDownList(dropDownList: Node) {
        dropDownList.destroy();
    }

    protected createItem(itemTemplate: DropDownItem): DropDownItem {
        let newItem = instantiate(itemTemplate.node);
        return newItem.getComponent<DropDownItem>(DropDownItem);
    }

    private onSelectedItem(toggle: Toggle) {
        let parent = toggle.node.parent;
        for (let i = 0; i < parent.children.length; i++) {
            if (parent.children[i] == toggle.node) {
                this.selectedIndex = i - 1;
                break;
            }
        }
        this.hide();
    }

    private onClick() {
        if (!this.isShow) {
            this.show();
        } else {
            this.hide();
        }
    }

    start() {
        this.template.active = false;
        if (this.isDefaultSet == false) {
            this.setDefaultOption(0);
        }
    }

    onEnable() {
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    onDisable() {
        this.node.off(Node.EventType.TOUCH_END, this.onClick, this);
    }

    private clamp(value: number, min: number, max: number): number {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
}