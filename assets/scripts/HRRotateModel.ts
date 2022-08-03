
import { _decorator, Component, Node, EventTouch, Vec3, Camera, geometry, PhysicsSystem, input, Input } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('HRRotateModel')
export class HRRotateModel extends Component {
    @property(Node) public target: Node = null;
    @property(Camera) readonly cameraCom!: Camera;
    private _ray: geometry.Ray = new geometry.Ray();

    private _touchReference: Vec3 = new Vec3();
    private _touchOffset: Vec3 = new Vec3();
    private _isRotating = false;
    private _targetValue = 0;
    private _currValue = 0;

    onLoad() {
        input.on(Input.EventType.TOUCH_START, this._onTouchBegan, this);
        input.on(Input.EventType.TOUCH_END, this._onTouchEnded, this);
        input.on(Input.EventType.TOUCH_MOVE, this._onTouchMoved, this);
        input.on(Input.EventType.TOUCH_CANCEL, this._onTouchCancelled, this);
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this._onTouchBegan, this);
        input.on(Input.EventType.TOUCH_END, this._onTouchEnded, this);
        input.on(Input.EventType.TOUCH_MOVE, this._onTouchMoved, this);
        input.on(Input.EventType.TOUCH_CANCEL, this._onTouchCancelled, this);
    }

    setTarget(target: Node) {
        this.target = target;
        this._currValue = 0;
        this._targetValue = 0;
        this._touchReference = new Vec3();
        this._touchOffset = new Vec3();
    }

    protected _onTouchBegan(event?: EventTouch) {
        if (!event || !this._isValid()) {
            return;
        }
        const touch = event.touch!;
        this.cameraCom.screenPointToRay(touch.getLocationX(), touch.getLocationY(), this._ray);
        if (PhysicsSystem.instance.raycast(this._ray)) {
            const raycastResults = PhysicsSystem.instance.raycastResults;
            for (let i = 0; i < raycastResults.length; i++) {
                const item = raycastResults[i];
                if (item.collider.node == this.target) {
                    this._currValue = this.target.eulerAngles.y;
                    this._isRotating = true;
                    const touchPos = event.touch?.getUILocation();
                    Vec3.set(this._touchReference, touchPos.x, touchPos.y, 0);

                    event.propagationStopped = true;
                    break;
                }
            }
        }
    }

    protected _onTouchMoved(event?: EventTouch) {
        if (!this._isRotating || !event || !this._isValid()) {
            return;
        }

        const touch = event.touch;

        if (!touch) {
            return;
        }

        const touchPos = touch.getUILocation();
        const v3Pos: Vec3 = new Vec3(touchPos.x, touchPos.y, 0);
        Vec3.subtract(this._touchOffset, v3Pos, this._touchReference);
        this._targetValue = this.target.eulerAngles.y + this._touchOffset.x + this._touchOffset.y;
        this._touchReference = v3Pos.clone();

        event.propagationStopped = true;
    }

    protected _onTouchEnded(event?: EventTouch) {
        this._isRotating = false;

        if (event) {
            event.propagationStopped = true;
        }
    }

    protected _onTouchCancelled(event?: EventTouch) {
        this._isRotating = false;
        if (event) {
            event.propagationStopped = true;
        }
    }

    update(dt: number) {
        if (!this._isRotating || !this._isValid()) return;
        this._currValue += (this._targetValue - this._currValue) * (dt * 60);
        this.target.setRotationFromEuler(0, this._currValue, 0);
    }

    private _isValid(): boolean {
        return this.target && this.target.isValid;
    }
}