import { DynamicObject } from "./dynamicObject.js";
import { createSnakeBody } from "../core/physics.js";
import {
    createSnakeMesh,
    createLightRayMesh
} from "../core/renderer.js";
import { Opponent, Difficulty } from "../constants.js";
import { showHpBar, updateHpBar } from "../ui/hpBar.js";

export class Snake extends DynamicObject {

    static id = 0;
    static MASS = 2;
    static FORCE_SCALE = 60;
    static JUMP_INTERVAL = 5000;
    static JUMP_FORCE = 60;
    static WEAK_SEGMENT_DAMAGE_COEF = 3;


    static initialPosition = { x: 0, z: -6 };

    constructor(difficulty) {

        super();
        const { x, z } = Snake.initialPosition;

        this.radius = 2;
        this.segmentCount = 7;
        this.id = Snake.id++;
        this.difficulty = difficulty;

        // 頭以外のセグメントから弱点を1つ選ぶ
        this.weakSegmentIndex = 1 + Math.floor(
            Math.random() * (this.segmentCount - 1)
        );

        const snake = createSnakeBody(
            x,
            z,
            this.radius,
            this.segmentCount,
            Snake.MASS
        );

        this.bodies = snake.bodies;
        this.constraints = snake.constraints;

        this.lightRayMesh = createLightRayMesh();

        this.rayDirection = new THREE.Vector3();
        this.rayMidPoint = new THREE.Vector3();
        this.rayYAxis = new THREE.Vector3(0, 1, 0);

        this.difficulty = Number(difficulty);

        this.meshes = createSnakeMesh(
            x,
            z,
            this.radius,
            this.segmentCount,
            this.weakSegmentIndex
        );

        switch (this.difficulty) {
            case Difficulty.EASY:
                this.maxHp = 30;
                break;
            case Difficulty.NORMAL:
                this.maxHp = 50;
                break;
            case Difficulty.HARD:
            default:
                this.maxHp = 100;
                break;
        }

        this.hp = this.maxHp;
        this.isBattleFinished = false;
        showHpBar();

        this.bodies.forEach((body, segmentIndex) => {
            body.addEventListener(
                'collide',
                (event) => this.handleCollisionEvent(event, segmentIndex)
            );
        });

        this.nextJumpTime = performance.now() + Snake.JUMP_INTERVAL;
    }

    handleCollisionEvent(event, segmentIndex) {
        if (this.isBattleFinished || event.body.name !== 'ball') return;

        // 頭は攻撃判定。ボールが触れた時点でゲームオーバーにする
        if (segmentIndex === 0) {
            this.isBattleFinished = true;
            const gameOverEvent = new CustomEvent('game-over');
            window.dispatchEvent(gameOverEvent);
            return;
        }

        let damage = Math.abs(
            event.contact.getImpactVelocityAlongNormal()
        );

        if (segmentIndex === this.weakSegmentIndex) {
            damage *= Snake.WEAK_SEGMENT_DAMAGE_COEF;
        }

        if (damage <= 0) return;

        this.applyDamage(damage);
        updateHpBar((this.hp / this.maxHp) * 100);
    }

    applyDamage(damage) {
        this.hp = Math.max(0, this.hp - damage);

        if (this.hp > 0) return;

        this.isBattleFinished = true;

        const gameClearEvent = new CustomEvent('game-clear');

        window.dispatchEvent(gameClearEvent);
    }

    update(target){
        // 物理演算
        this.chase(target);
        // ビジュアル更新
        this.updateVisuals();

        // 頭からボールへ光線を表示
        this.emitLightRay(target.mesh.position);
    }

    updateBehavior(target) {

    }

    chase(target) {

        const targetPos = this.getTargetPosition(target);

        const head = this.bodies[0];

        const p = head.position;

        const dx = targetPos.x - p.x;
        const dz = targetPos.z - p.z;

        const distance = Math.hypot(dx, dz);

        const fx = dx / distance * Snake.FORCE_SCALE;
        const fz = dz / distance * Snake.FORCE_SCALE;

        const forceVector = new CANNON.Vec3(fx, 0, fz);

        this.applyForce(forceVector, head);

        if (performance.now() > this.nextJumpTime) {
            const jumpForceVector = new CANNON.Vec3(fx, Snake.JUMP_FORCE, fz);
            this.applyImpulse(jumpForceVector, head);
            this.nextJumpTime += Snake.JUMP_INTERVAL;
        }

        // 顔を進行方向へ向ける
        this.faceYaw = Math.atan2(dx, dz);
    }

    /**
    * スネークのビジュアルを物理演算の結果に合わせて更新する関数
    * @param {void}
    * @returns {void}
    */
    updateVisuals() {
        // スネークの各セグメントの位置と姿勢を物理演算の結果に合わせて更新
        for (let i = 0; i < this.bodies.length; i++) {
            this.meshes[i].position.copy(
                this.bodies[i].position
            );
            // 頭のセグメントは顔の向きに合わせて回転させる
            if(i == 0) {
                this.meshes[i].rotation.set(0, this.faceYaw, 0); 
                continue;
            }
            this.meshes[i].quaternion.copy(
                this.bodies[i].quaternion
            );
        }
    }

    /**
    * 光線を放つ関数
    * @param {THREE.Vector3} targetPosition - 光線の終点
    * @returns {void}
    */
    emitLightRay(targetPosition) {

        // 光線のメッシュを取得(コンストラクタで作成済み)
        const mesh = this.lightRayMesh;

        // 光線の視点はスネークの頭の位置(仮)
        const start = this.meshes[0].position;

        // 光線の終点はボールの位置
        const end = targetPosition;

        // 始点と終点の差分をとることにより、光線の方向ベクトルを計算
        this.rayDirection.subVectors(end, start);

        // 光線の長さを計算
        const length = this.rayDirection.length();

        // 光線が短い場合は表示を省略
        if (length < 0.001) {
            mesh.visible = false;
            return;
        }

        mesh.visible = true;

        // 光線の中心を計算(メッシュ座標はメッシュの中心で与えなければならないため、メッシュの中心を算出)
        this.rayMidPoint
            .addVectors(start, end)
            .multiplyScalar(0.5);

        // メッシュ位置の反映
        mesh.position.copy(this.rayMidPoint);

        // メッシュのスケールの反映
        mesh.scale.set(1, length, 1);

        // メッシュの姿勢を反映
        mesh.quaternion.setFromUnitVectors(
            this.rayYAxis,
            this.rayDirection.normalize()
        );
    }
}
