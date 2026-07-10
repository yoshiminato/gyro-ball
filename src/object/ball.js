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

    judgeCanJump(world){

        const normal = new CANNON.Vec3();

        for(const c of world.contacts){
            if (c.bi !== this.body && c.bj !== this.body)
            continue;

            const opponent = (c.bi === this.body) ? c.bj : c.bi;

            if (c.bi === this.body)
                c.ni.negate(normal);
            else
                normal.copy(c.ni);

            if (normal.y < 0.5)
                continue;

            this.canJump = true;
            return;
        }
        this.canJump = false;
    }



    // ジャンプ
    triggerJump() {
        if(!this.canJump) return;
        
        this.body.applyImpulse(new CANNON.Vec3(0, Ball.JUMP_FORCE, 0), this.body.position);
        this.canJump = false;
        
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

    checkGrounded(world) {
        const rayStart  = new CANNON.Vec3(
            this.body.position.x,
            this.body.position.y,
            this.body.position.z
        );
        const rayTarget = new CANNON.Vec3(rayStart.x, rayStart.y - (Ball.BALL_R + 0.1), rayStart.z);

        let isGrounded = false;

        const raycastResult = new CANNON.RaycastResult();
        world.raycastClosest(rayStart, rayTarget, {}, raycastResult);
        
        if (raycastResult.hasHit) {
            isGrounded = true;
        }

        return isGrounded;
    }
}