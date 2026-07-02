import { gyroEnabled, calculateForceFromGyro} from './input/gyro.js';
import { calculateForceFromKeys } from './input/keyboard.js';

export class Ball{

    static BALL_R = 0.6;
    static FORCE_SCALE = 60;
    static HEADING_SCALE = 2.0;
    static MAX_VEL = 15;

    constructor(ballBody){ 
        this.body = ballBody;

        // ボールの向き
        this.heading = 0;

        // ボールにかかる物理的な力
        this.fx = 0;
        this.fz = 0;
    }

    resetHeading(){
        this.heading = 0;
    }

    calculateForce(dt){
        if (gyroEnabled)           
            calculateForceFromGyro(this, dt);
        else
            calculateForceFromKeys(this, dt);
        
    }

    applyForce() {
        const fx = this.fx;
        const fz = this.fz;
        if (fx !== 0 || fz !== 0) {
            const bp = this.body.position;
            this.body.applyForce(new CANNON.Vec3(fx, 0, fz), new CANNON.Vec3(bp.x, bp.y, bp.z));
        }  
    }

    clampVelocity() {
        const v = this.body.velocity;
        if (v.length() > Ball.MAX_VEL) {
            v.scale(Ball.MAX_VEL / v.length(), v);
        }
    }
}