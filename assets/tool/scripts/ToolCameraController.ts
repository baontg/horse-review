
import { _decorator, Component, Node, Input, EventKeyboard, KeyCode, input, Vec3, Quat, Camera, director, EventMouse, game, __private } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ToolCameraController')
export class ToolCameraController extends Component {

    @property(Camera)
    protected camera3D: Camera = null;

    @property(Node)
    protected tarGet: Node = null;

    @property(Node)
    protected cameraPos: Node = null;

    @property(Node)
    protected tarGetRender: Node = null;

    protected static instance: ToolCameraController = null;
    public static get Instance(): ToolCameraController {
        return ToolCameraController.instance;
    }

    onLoad() {
        ToolCameraController.instance = this;
    }

    protected isFollowTarget = true;
    public get IsFollowTarget(): boolean {
        return this.isFollowTarget;
    }

    //protected tarGetPos = new Vec3(0, 1, 0);
    protected speedRotateLeft = new Vec3(0, -90, 0);
    protected speedRotateRight = new Vec3(0, 90, 0);
    protected speedRotate = 90;
    protected speedZoom = 2;
    protected speedMoveTarget = 1;
    protected minDistance = 0.5;
    protected maxDistance = 5;
    protected invertCamera = -1;
    protected mouseButton = -1;

    start() {
        input.on(Input.EventType.KEY_DOWN, this.OnKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.OnKeyUp, this);
        input.on(Input.EventType.MOUSE_WHEEL, this.OnMouseWheelEvent, this);
        input.on(Input.EventType.MOUSE_DOWN, this.OnMouseDownEvent, this);
        input.on(Input.EventType.MOUSE_UP, this.OnMouseUpEvent, this);

        this.UpdateCamera();

        window['log'] = () => {
            console.log('position', this.tarGet.position);
            console.log('euler', this.tarGet.eulerAngles);
            console.log('scale', this.tarGet.scale);
            console.log('cameraPos position', this.cameraPos.position);
            console.log('cameraPos euler', this.cameraPos.eulerAngles);
        }
    }
    update(deltaTime: number) {
        this.UpdateInput(deltaTime);
    }

    UpdateInput(deltaTime: number) {
        if (this.isPressKeyA) {
            this.MoveTarGet(0, this.speedMoveTarget, deltaTime);
            //this.RotateAround(this.speedRotateLeft, deltaTime);
        }
        else if (this.isPressKeyD) {
            this.MoveTarGet(0, -this.speedMoveTarget, deltaTime);
            //this.RotateAround(this.speedRotateRight, deltaTime);
        }
        if (this.isPressKeyW) {
            this.MoveTarGet(this.speedMoveTarget, 0, deltaTime);
            //this.RotateUpDown(-this.speedRotate, deltaTime);
        }
        else if (this.isPressKeyS) {
            this.MoveTarGet(-this.speedMoveTarget, 0, deltaTime);
            //this.RotateUpDown(this.speedRotate, deltaTime);
        }

        if (this.isPressKeyQ) {
            this.MoveTarGetUpDown(-this.speedMoveTarget, deltaTime);
        }
        else if (this.isPressKeyE) {
            this.MoveTarGetUpDown(this.speedMoveTarget, deltaTime);
        }

        if (this.isPressKeyZ) {
            this.Zoom(-this.speedZoom, deltaTime);
        }
        else if (this.isPressKeyX) {
            this.Zoom(this.speedZoom, deltaTime);
        }

        if (this.isPressKeyUp) {
            this.RotateUpDown(this.speedRotate, deltaTime);
            //this.MoveTarGet(this.speedMoveTarget, 0, deltaTime);
        }
        else if (this.isPressKeyDown) {
            this.RotateUpDown(-this.speedRotate, deltaTime);
            //this.MoveTarGet(-this.speedMoveTarget, 0, deltaTime);
        }
        if (this.isPressKeyLeft) {
            this.RotateAround(this.speedRotateLeft, -deltaTime);
            //this.MoveTarGet(0, this.speedMoveTarget, deltaTime);
        }
        else if (this.isPressKeyRight) {
            this.RotateAround(this.speedRotateRight, -deltaTime);
            //this.MoveTarGet(0, -this.speedMoveTarget, deltaTime);
        }
    }

    FollowTarget(position: Vec3) {
        //console.log("FollowTarget " + position);
        //position.y = this.tarGet.position.y;
        this.tarGet.position = Vec3.lerp(this.tarGet.position, this.tarGet.position, position, 0.05);
        // let dir = position.subtract(this.tarGet.position);
        // if(dir.length() > 0.005)
        //     this.tarGet.position = this.tarGet.position.add(dir.normalize().multiplyScalar(0.005));
        // else
        //     this.tarGet.position = position;
        this.UpdateCamera();
    }

    UpdateCamera() {
        this.camera3D.node.worldPosition = this.cameraPos.worldPosition;
        this.camera3D.node.forward = this.camera3D.node.position.clone().subtract(this.tarGet.worldPosition.clone()).normalize().multiplyScalar(-1);
    }

    Zoom(speed: number, deltaTime: number = 1) {
        speed *= this.invertCamera;
        deltaTime /= director.getScheduler().getTimeScale();
        let scale = this.tarGet.scale.x + speed * deltaTime;
        if (scale < this.minDistance)
            scale = this.minDistance;
        else if (scale > this.maxDistance)
            scale = this.maxDistance;
        this.tarGet.scale = new Vec3(scale, scale, scale);
        if (this.cameraPos.worldPosition.y < 0.1) {
            this.RotateUpDown(-this.speedRotate / 5, deltaTime);
        }
        else
            this.UpdateCamera();
    }

    RotateUpDown(speed: number, deltaTime: number = 1) {
        speed *= this.invertCamera;
        deltaTime /= director.getScheduler().getTimeScale();
        let dir = this.camera3D.node.position.clone().subtract(this.tarGet.position.clone());
        let dirA = dir.clone();
        dirA.y = 0;
        let angle = Vec3.angle(dir, dirA);
        //console.log("RotateUpDown " + angle + " " + this.camera3D.node.position + " " + this.camera3D.node.forward + " " + this.tarGet.eulerAngles);
        if ((speed < 0 && angle > 1) || (speed > 0 && (this.cameraPos.worldPosition.y < 0 || (this.cameraPos.worldPosition.y < this.tarGet.position.y && angle > 1))))
            return;

        let quat = new Quat();
        Quat.rotateX(quat, this.tarGet.rotation, deltaTime * speed * Math.PI / 180);
        this.tarGet.setRotation(quat);
        this.UpdateCamera();
    }

    RotateAround(angle: Vec3, deltaTime: number = 1) {
        deltaTime *= this.invertCamera;
        deltaTime /= director.getScheduler().getTimeScale();
        //console.log("RotateAround " + angle + " " + this.camera3D.node.position + " " + this.camera3D.node.forward + " " + this.tarGet.eulerAngles);
        let quat = new Quat();
        quat = Quat.rotateAround(quat, this.tarGet.rotation, Vec3.UP, deltaTime * angle.y * Math.PI / 180);
        this.tarGet.setRotation(quat);
        this.UpdateCamera();
        //console.log("--RotateAround END " + this.camera3D.node.position + " " + this.camera3D.node.forward + " " + this.tarGet.eulerAngles);

    }

    MoveTarGetUpDown(speedUp: number, deltaTime: number = 1) {
        deltaTime /= director.getScheduler().getTimeScale();
        let pos = this.tarGet.position.clone();
        pos.y += speedUp * deltaTime;
        if (pos.y < 0)
            pos.y = 0;
        if (pos.y > 5)
            pos.y = 5;
        if (pos.length() > this.maxDistance) {
            pos.normalize().multiplyScalar(this.maxDistance);
        }
        this.tarGet.position = pos;
        if (this.cameraPos.worldPosition.y < 0.1) {
            this.RotateUpDown(-this.speedRotate / 2, deltaTime);
        }
        else
            this.UpdateCamera();
        //console.log("MoveTarGet "+ speed + " " + this.tarGet.position);
    }

    MoveTarGet(SpeedForward: number, SpeedRight: number, deltaTime: number = 1) {
        deltaTime /= director.getScheduler().getTimeScale();
        //console.log("MoveTarGet "+ SpeedForward + " " + SpeedRight + " " + this.tarGet.position + " deltaTime " + deltaTime);
        let newPos = this.tarGet.worldPosition.clone();

        if (SpeedForward != 0) {
            let dir = this.tarGet.worldPosition.clone().subtract(this.camera3D.node.worldPosition.clone());
            dir.normalize();
            dir.multiplyScalar(SpeedForward * deltaTime);
            newPos = this.tarGet.worldPosition.clone().add(dir);
        }
        if (SpeedRight != 0) {
            newPos.add(this.camera3D.node.right.clone().multiplyScalar(-SpeedRight * deltaTime));
        }
        if (newPos.y < 0)
            newPos.y = 0;
        if (newPos.y > 5)
            newPos.y = 5;
        if (newPos.length() > this.maxDistance) {
            newPos.normalize().multiplyScalar(this.maxDistance);
        }
        this.tarGet.position = newPos;
        this.UpdateCamera();
        //console.log("--MoveTarGet "+ dir + " " + this.tarGet.position);
    }

    SetExposure(exposure) {
        this.camera3D.aperture = Math.floor((1 - exposure) * 22.99); // defaul aperture F16, at progress 0.17
    }


    public get FOV(): number {
        return this.camera3D.fov;
    }

    public set FOV(fov) {
        this.camera3D.fov = fov;
    }


    protected isPressKeyA = false;
    protected isPressKeyD = false;
    protected isPressKeyW = false;
    protected isPressKeyS = false;
    protected isPressKeyQ = false;
    protected isPressKeyE = false;
    protected isPressKeyZ = false;
    protected isPressKeyX = false;
    protected isPressKeyUp = false;
    protected isPressKeyDown = false;
    protected isPressKeyLeft = false;
    protected isPressKeyRight = false;
    OnKeyDown(event: EventKeyboard) {
        //console.log("OnKeyDown " + event.keyCode + " isPressed " + event.isPressed + " isStopped " + event.isStopped());
        //this.ResetImput();
        this.isPressKeyA = false;
        switch (event.keyCode) {
            case KeyCode.ARROW_LEFT:
                //console.log('Press key Left');
                this.isPressKeyLeft = true;
                break;
            case KeyCode.ARROW_RIGHT:
                //console.log('Press key Right');
                this.isPressKeyRight = true;
                break;
            case KeyCode.ARROW_UP:
                //console.log('Press key Up');
                this.isPressKeyUp = true;
                break;
            case KeyCode.ARROW_DOWN:
                //console.log('Press key Down');
                this.isPressKeyDown = true;
                break;
            case KeyCode.KEY_A:
                //console.log('Press key A');
                this.isPressKeyA = true;
                break;
            case KeyCode.KEY_D:
                //console.log('Press key D');
                this.isPressKeyD = true;
                break;
            case KeyCode.KEY_W:
                //console.log('Press key W');
                this.isPressKeyW = true;
                break;
            case KeyCode.KEY_S:
                //console.log('Press key S');
                this.isPressKeyS = true;
                break;
            case KeyCode.KEY_Q:
                //console.log('Press key Q');
                this.isPressKeyQ = true;
                break;
            case KeyCode.KEY_E:
                //console.log('Press key E');
                this.isPressKeyE = true;
                break;
            case KeyCode.KEY_Z:
                //console.log('Press key Z');
                this.isPressKeyZ = true;
                break;
            case KeyCode.KEY_X:
                //console.log('Press key X');
                this.isPressKeyX = true;
                break;
        }
    }

    OnKeyUp(event: EventKeyboard) {
        //console.log("-OnKeyUp " + event.keyCode + " isPressed " + event.isPressed + " isStopped " + event.isStopped());
        switch (event.keyCode) {

            case KeyCode.ARROW_LEFT:
                //console.log('Press key Left');
                this.isPressKeyLeft = false;
                break;
            case KeyCode.ARROW_RIGHT:
                //console.log('Press key Right');
                this.isPressKeyRight = false;
                break;
            case KeyCode.ARROW_UP:
                //console.log('Press key Up');
                this.isPressKeyUp = false;
                break;
            case KeyCode.ARROW_DOWN:
                //console.log('Press key Down');
                this.isPressKeyDown = false;
                break;
            case KeyCode.KEY_A:
                //console.log('Press key A');
                this.isPressKeyA = false;
                break;
            case KeyCode.KEY_D:
                //console.log('Press key D');
                this.isPressKeyD = false;
                break;
            case KeyCode.KEY_W:
                //console.log('Press key W');
                this.isPressKeyW = false;
                break;
            case KeyCode.KEY_S:
                //console.log('Press key S');
                this.isPressKeyS = false;
                break;
            case KeyCode.KEY_Q:
                //console.log('Press key Q');
                this.isPressKeyQ = false;
                break;
            case KeyCode.KEY_E:
                //console.log('Press key E');
                this.isPressKeyE = false;
                break;
            case KeyCode.KEY_Z:
                //console.log('Press key Z');
                this.isPressKeyZ = false;
                break;
            case KeyCode.KEY_X:
                //console.log('Press key X');
                this.isPressKeyX = false;
                break;
        }
    }

    OnMouseWheelEvent(event: EventMouse) {
        if (event.getScrollY() > 0) {
            //this.isPressKeyE = true;
            this.Zoom(this.speedZoom, game.deltaTime * event.getScrollY() / 100);
        } else if (event.getScrollY() < 0) {
            //this.isPressKeyQ = true;
            this.Zoom(-this.speedZoom, game.deltaTime * -event.getScrollY() / 100);
        }
    }

    OnMouseDownEvent(event: EventMouse) {
        this.mouseButton = event.getButton();
        input.on(Input.EventType.MOUSE_MOVE, this.OnMouseMoveEvent, this);
    }

    OnMouseUpEvent() {
        this.mouseButton = -1;
        input.off(Input.EventType.MOUSE_MOVE, this.OnMouseMoveEvent, this);
    }

    OnMouseMoveEvent(event: EventMouse) {
        // left mouse
        if (this.mouseButton == EventMouse.BUTTON_LEFT) {
            // if(event.movementY > 1)
            // {
            //     this.RotateUpDown(this.speedRotate, game.deltaTime*event.movementY/10);
            // }
            // else if(event.movementY < -1)
            // {
            //     this.RotateUpDown(-this.speedRotate, game.deltaTime*-event.movementY/10);
            // }
        }
        else if (this.mouseButton == EventMouse.BUTTON_RIGHT) {
            if (event.movementX > 1) {
                this.RotateAround(this.speedRotateRight, game.deltaTime * event.movementX / 10);
            }
            else if (event.movementX < -1) {
                this.RotateAround(this.speedRotateLeft, game.deltaTime * -event.movementX / 10);
            }

            if (event.movementY > 1) {
                this.MoveTarGetUpDown(this.speedMoveTarget, game.deltaTime * event.movementY / 10);
            }
            else if (event.movementY < -1) {
                this.MoveTarGetUpDown(-this.speedMoveTarget, game.deltaTime * -event.movementY / 10);
            }
        }
    }

    ShowHideTargetNode(isShow: boolean) {
        if (!this.tarGetRender)
            return;

        if (this.tarGetRender.active != isShow) {
            this.tarGetRender.active = isShow;
        }
    }

    ResetInput() {
        this.isPressKeyA = false;
        this.isPressKeyD = false;
        this.isPressKeyW = false;
        this.isPressKeyS = false;
        this.isPressKeyQ = false;
        this.isPressKeyE = false;
        this.isPressKeyZ = false;
        this.isPressKeyX = false;
        this.isPressKeyUp = false;
        this.isPressKeyDown = false;
        this.isPressKeyLeft = false;
        this.isPressKeyRight = false;
    }
}