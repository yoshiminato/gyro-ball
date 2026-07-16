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
    static JUMP_FORCE = 50;

    initialPosition = { x: 0, y: Ball.BALL_R + 1, z: 0 };

    constructor(){ 
        super();

        // ボール生成(物理エンジン側)
        this.body = createBallBody(Ball.BALL_R);
        this.mesh = createBallMesh(Ball.BALL_R);

        this.body.name = 'ball';

    }


    
    resetHeading(){
        this.heading = 0;
    }

    // ボールの位置を初期位置にリセット
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

    // ジャンプ
    triggerJump() {
        if(!this.canJump) return;
        const forceVector = new CANNON.Vec3(0, Ball.JUMP_FORCE, 0);
        this.applyImpulse(forceVector);
        this.canJump = false;
    }

    // 入力に応じて力を計算
    calculateForce(dt){
        let force;
        if (gyroEnabled)           
            force = calculateForceFromGyro(this, dt);
        else
            force = calculateForceFromKeys(this, dt);  
        return force;    
    }

    // 速度制限
    clampVelocity() {
        const v = this.body.velocity;
        if (v.length() > Ball.MAX_VEL) {
            v.scale(Ball.MAX_VEL / v.length(), v);
        }
    }

    update(dt){
        // 物理演算
        const forceVector = this.calculateForce(dt);
        this.applyForce(forceVector);
        this.clampVelocity();
        // ビジュアル更新
        this.updateVisuals();
    }
}