import { gyroEnabled, calculateForceFromGyro} from '../input/gyro.js';
import { calculateForceFromKeys } from '../input/keyboard.js';
import { createBallBody } from '../core/physics.js';
import { createBallMesh } from '../core/renderer.js';
import { DynamicObject } from './dynamicObject.js';


export class Ball extends DynamicObject{

    static BALL_R = 0.6;
    static FORCE_SCALE = 60;
    static HEADING_SCALE = 2.0;
    static MAX_VEL = 15;

    initialPosition = { x: 0, y: Ball.BALL_R + 1, z: 0 };

    constructor(){ 
        super();

        // ボール生成(物理エンジン側)
        this.body = createBallBody(Ball.BALL_R);
        this.mesh = createBallMesh(Ball.BALL_R);
    }

    resetHeading(){
        this.heading = 0;
    }

    resetPosition(){
        this.body.position.set(
            this.initialPosition.x, 
            this.initialPosition.y,
            this.initialPosition.z
        );
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        this.body.quaternion.set(0, 0, 0, 1);
    }

    // ジャンプ(簡易実装)
    triggerJump() {
        if (this.body.position.y < 2.0) {
            this.body.velocity.y = 50;
        }
    }

    calculateForce(dt){
        if (gyroEnabled)           
            calculateForceFromGyro(this, dt);
        else
            calculateForceFromKeys(this, dt);      
    }

    clampVelocity() {
        const v = this.body.velocity;
        if (v.length() > Ball.MAX_VEL) {
            v.scale(Ball.MAX_VEL / v.length(), v);
        }
    }
}