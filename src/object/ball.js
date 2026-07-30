import { gyroEnabled, calculateForceFromGyro} from '../input/gyro.js';
import { calculateForceFromKeys } from '../input/keyboard.js';
import { createBallBody } from '../core/physics.js';
import { createBallMesh } from '../core/renderer.js';
import { DynamicObject } from './dynamicObject.js';

/**
 * キーボードまたはジャイロ入力で操作するプレイヤーボール。
 */
export class Ball extends DynamicObject{

    static BALL_R = 1;
    static FORCE_SCALE = 60;
    static HEADING_SCALE = 2.0;
    static MAX_VEL = 15;
    static JUMP_FORCE = 30;

    initialPosition = { x: 0, y: Ball.BALL_R + 1, z: 0 };
    initialHeading = 0;

    constructor(){ 
        super();

        // チュートリアルの説明中に操作を止めるためのフラグ
        this.inputEnabled = true;
        // チュートリアル側で、実際にジャンプできたことを判定するための回数
        this.jumpCount = 0;

        // ボール生成(物理エンジン側)
        this.body = createBallBody(Ball.BALL_R);
        this.mesh = createBallMesh(Ball.BALL_R);

        this.body.name = 'ball';

    }
    
    resetHeading(){
        this.heading = this.initialHeading;
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

    reset() {
        this.resetPosition();
        this.resetHeading();
    }

    // チュートリアルの進行に応じてユーザー入力を有効・無効にする
    setInputEnabled(enabled) {
        this.inputEnabled = enabled;

        if (!enabled && this.body) {
            this.body.velocity.x = 0;
            this.body.velocity.z = 0;
            this.body.angularVelocity.set(0, 0, 0);
        }
    }

    /**
     * 接地中に上向きの力積を加える。
     * @returns {void}
     */
    triggerJump() {
        if (!this.inputEnabled) return;
        if(!this.canJump) return;
        const forceVector = new CANNON.Vec3(0, Ball.JUMP_FORCE, 0);
        this.applyImpulse(forceVector);
        this.canJump = false;
        this.jumpCount++;
    }

    /**
     * 現在有効な入力方式から推進力を求める。
     * @param {number} dt - 前フレームからの経過秒数
     * @returns {CANNON.Vec3} ボールへ加える力
     */
    calculateForce(dt){
        if (!this.inputEnabled) {
            return new CANNON.Vec3(0, 0, 0);
        }

        let force;
        if (gyroEnabled)           
            force = calculateForceFromGyro(this, dt);
        else
            force = calculateForceFromKeys(this, dt);  
        return force;    
    }

    /**
     * 水平面の合成速度へ上限を設ける。
     * ジャンプと落下の操作感を保つため、Y方向の速度は変更しない。
     */
    clampVelocity() {
        const v = this.body.velocity;
        const horizontalSpeed = Math.hypot(v.x, v.z);
        if (horizontalSpeed <= Ball.MAX_VEL) return;

        const scale = Ball.MAX_VEL / horizontalSpeed;
        v.x *= scale;
        v.z *= scale;
    }

    /**
     * 入力、速度制限、描画同期を1フレーム分更新する。
     * @param {number} dt - 前フレームからの経過秒数
     * @returns {void}
     */
    update(dt){
        // 物理演算
        const forceVector = this.calculateForce(dt);
        this.applyForce(forceVector);
        this.clampVelocity();
        // ビジュアル更新
        this.updateVisuals();
    }
}
