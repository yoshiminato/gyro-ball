import {gyroEnabled, calclateHeadingFromGyro, calclateForceFromGyro} from './input/gyro.js';

export class Ball{

    static BALL_R = 0.6;
    static FORCE_SCALE = 60;
    static HEADING_SCALE = 2.0;

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

    calclateForce(dt){
        if (gyroEnabled) {            
            calclateHeadingFromGyro(this, dt);
            calclateForceFromGyro(this);
        } else{
            //
        }
    }

    applyForce() {

        const fx = this.fx;
        const fz = this.fz;
        if (fx !== 0 || fz !== 0) {
            const bp = this.body.position;
            this.body.applyForce(new CANNON.Vec3(fx, 0, fz), new CANNON.Vec3(bp.x, bp.y, bp.z));
        }
        
    }
}