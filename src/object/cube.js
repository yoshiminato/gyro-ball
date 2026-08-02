import {
    Difficulty,
    DifficultyNames,
    MIN_DAMAGE_IMPACT_SPEED
} from '../constants.js';
import { createCubeBody } from '../core/physics.js';
import { createCubeMesh } from '../core/renderer.js';
import { DynamicObject } from './dynamicObject.js';
import { showHpBar, updateHpBar } from '../ui/hpBar.js';
import { CubeTutorial } from '../tutorial/cubeTutorial.js';
import { getGameTime } from '../core/gameClock.js';
import { playEnemyHitSfx } from '../audioManager.js';
import { spawnHitEffect } from '../core/hitEffects.js';


export class Cube extends DynamicObject {
    
    static MASS = 2.0;                   // 質量  
    static WEAK_FACE_DAMAGE_COEF = 3.0;  // 弱点面のダメージ倍率

    static TURN_SPEED = {                // 平時ターン速度
        'Tutorial': 0.009,
        'Easy': 0.007,
        'Normal': 0.009,
        'Hard': 0.015
    }
    static WARNING_TURN_SPEED = {        // 突進待機時ターン速度
        'Easy': 0.01,
        'Normal': 0.015,
        'Hard': 0.2
    }
    static CHACE_FORCE = {               // 追跡時に印加する力
        'Tutorial': 55,
        'Easy': 53,
        'Normal': 55,
        'Hard': 60
    }
    static DASH_FORCE = {                // 突進時に印加する力
        'Easy': 0,
        'Normal': 50,
        'Hard': 60
    }
    static DASH_WARNING_DURATION = {     // 突進待機時間
        'Easy': 0,
        'Normal': 1200,
        'Hard': 1000
    }
    static DASH_BLINK_INTERVAL = 150;    // 点滅周期

    static MAX_HP = {                    // 最大HP
        'Easy': 30,
        'Normal': 50,
        'Hard': 100
    }

    static FACE = {                      // 面の識別子
        RIGHT: 0,
        LEFT: 1,
        TOP: 2,
        BOTTOM: 3,
        FRONT: 4,
        BACK: 5,
        NONE: -1
    };

    static initialPosition = { x: 0, z: -10, h: 3, w: 3, d: 3 }; // 初期位置とサイズ

    constructor(difficulty) {
        const { x, z, h, w, d } = Cube.initialPosition;
        super();
        this.yaw = 0;                          // 回転角度（ラジアン）               
        this.difficulty = Number(difficulty);  // 難易度
        this.body = createCubeBody(x, z, w, h, d, Cube.MASS);                        // 物理エンジン側のボディ
        this.mesh = createCubeMesh(x, z, w, h, d, Cube.FACE.FRONT, Cube.FACE.BACK);  // ビジュアル側のメッシュ

        this.weakFace = Cube.FACE.BACK;        // 弱点面(背面)
        this.headFace = Cube.FACE.FRONT;       // 正面（進行方向）面

        

        this.dashCooldown = 4000; // 突進のクールダウン時間（ミリ秒）
        this.lastDashTime = getGameTime();
        this.isPreparingDash = false;          // 突進待機中
        this.dashWarningStartedAt = 0;


        switch (this.difficulty) {
            case Difficulty.EASY:
                this.maxHp = Cube.MAX_HP.Easy;
                break;
            case Difficulty.NORMAL:
                this.maxHp = Cube.MAX_HP.Normal;
                break;
            case Difficulty.HARD:
                this.maxHp = Cube.MAX_HP.Hard;
                break;
            default:
                this.maxHp = 100;
        }

        this.hp = this.maxHp;
        this.tutorial = null;

        if (this.difficulty !== Difficulty.TUTORIAL) {
            showHpBar();
        }

        this.body.addEventListener('collide', (event) => {
            this.handleDamageEvent(event);
        });

        // Tutorial選択時だけ、Cube専用チュートリアルを開始する
        if (this.difficulty === Difficulty.TUTORIAL) {
            this.tutorial = new CubeTutorial(this);
        }
    }

    /**
    * 衝突イベントのハンドラ
    * @param {CANNON.Event} event - 衝突イベント
    * @returns {void}　
    */
    handleDamageEvent(event) {

        if (this.isBattleFinished || this.tutorial?.phase === 'completed') return;

        // 衝突イベントからダメージを計算
        const damage = this.calculateDamage(event);

        // ダメージがない場合は処理を終了
        if(!damage) return;
        // ダメージ適用
        this.applyDamage(damage);
        playEnemyHitSfx(this.lastHitWasWeakPoint);
        const impactSpeed = Math.abs(event.contact.getImpactVelocityAlongNormal());
        spawnHitEffect(
            event,
            this.body,
            this.mesh,
            this.lastHitWasWeakPoint,
            impactSpeed
        );
        const restHpRate = this.hp / this.maxHp;
        updateHpBar(restHpRate * 100);
        this.tutorial?.notifyDamage(damage, {
            isWeakPoint: this.lastHitWasWeakPoint
        });

    }

    /**
    * 衝突イベントからダメージを計算
    * @param {CANNON.Event} event - 衝突イベント
    * @returns {number | null} - 計算されたダメージ量。ダメージがない場合はnullを返す　
    */
    calculateDamage(event) {

        if (event.body.name !== 'ball') return null;

        // 衝突面の法線ベクトル方向の速度を取得
        const impactSpeed = Math.abs(event.contact.getImpactVelocityAlongNormal());
        const worldNormal = event.contact.ni;
        const inv = this.body.quaternion.inverse();
        const localNormal = inv.vmult(worldNormal);
    
        // z前後(マイナス：前面、プラス：背面)
        // x左右(マイナス：右面、プラス：左面)
        // y上下(マイナス：下面、プラス：上面) 
        // Cubeの赤い正面は攻撃部位
        if (localNormal.z < -0.1) {
            // チュートリアル中は終了させず、危険部位の警告を表示する
            if (this.difficulty === Difficulty.TUTORIAL) {
                this.tutorial?.notifyDangerCollision();
                return null;
            }

            // ゲームオーバー
            const gameOverEvent = new CustomEvent('game-over');
            window.dispatchEvent(gameOverEvent);
            return null;
        }

        if (impactSpeed < MIN_DAMAGE_IMPACT_SPEED) return null;

        this.lastHitWasWeakPoint = false;

        switch (this.weakFace) {
            case Cube.FACE.BACK:
                this.lastHitWasWeakPoint = localNormal.z > 0.1;
                break;
        
            case Cube.FACE.LEFT:
                this.lastHitWasWeakPoint = localNormal.x > 0.1;
                break;
            
            case Cube.FACE.RIGHT:
                this.lastHitWasWeakPoint = localNormal.x < -0.1;
                break;
          
            case Cube.FACE.TOP:
                this.lastHitWasWeakPoint = localNormal.y > 0.1;
                break;
        }

        return this.lastHitWasWeakPoint
            ? Cube.WEAK_FACE_DAMAGE_COEF * impactSpeed
            : impactSpeed;
    }

    /**
    * 突進待機状態を解除
    * @param {number} damage - 受けたダメージ量
    * @returns {void}　
    */
    applyDamage(damage) {
        this.hp = Math.max(0, this.hp - damage);

        // チュートリアルの完了条件はTutorialController側で管理する
        if (this.difficulty === Difficulty.TUTORIAL) return;

        if (this.hp <= 0) {
            // cubeの破壊処理? & 勝利イベント
            const gameClearEvent = new CustomEvent('game-clear');
            window.dispatchEvent(gameClearEvent);
        }
    }

    /**
    * 状態更新
    * @param {Ball} target - ターゲット(操作対象のボール)
    * @returns {void}　
    */
    update(target) {
        // チュートリアル中は通常の追跡・突進を停止する
        if (this.tutorial) {
            this.tutorial.update(target);
            if (this.tutorial.enemyVisible) this.updateVisuals();
            return;
        }

        // 物理演算
        this.updateBehavior(target);
        // ビジュアル更新
        this.updateVisuals();
    }

    /**
    * 物理的挙動を制御
    * @param {Ball} target - ターゲット(操作対象のボール)
    * @returns {void}　
    */
    updateBehavior(target) {

        const now = getGameTime();

        // 突進待機中は移動せず、ターゲットの方向を向くだけにする
        if (this.isPreparingDash) {
            const difficultyName = DifficultyNames[this.difficulty];
            const warningTurnSpeed = Cube.WARNING_TURN_SPEED[difficultyName];
            this.turnTowardTarget(target, warningTurnSpeed);
            this.updateDashWarning(now);

            // 待機時間の取得
            const warningDuration = Cube.DASH_WARNING_DURATION[difficultyName];

            // 待機時間が経過したら突進を開始
            if (now - this.dashWarningStartedAt >= warningDuration) {
                this.finishDashWarning();
                this.dash();
                this.lastDashTime = now;
            }
            return;
        }

        // クールダウン終了後、すぐに突進せず予兆状態へ移行する
        if (now - this.lastDashTime >= this.dashCooldown) {
            const difficultyName = DifficultyNames[this.difficulty];
            const warningTurnSpeed = Cube.WARNING_TURN_SPEED[difficultyName];

            this.startDashWarning(now);
            this.turnTowardTarget(target, warningTurnSpeed);
            return;
        }

        // 通常時のみターゲットを追跡する
        this.chase(target);
    }

    /**
    * ターゲットの方向へ回転
    * @param {Ball} target - ターゲット(操作対象のボール)
    * @param {number} turnSpeed - 回転速度
    * @returns {void}　
    */
    turnTowardTarget(target, turnSpeed) {

        // 異常値チェック
        if (!Number.isFinite(turnSpeed)) {
            console.error(`回転速度が異常値: ${turnSpeed}`);
            return;
        }

        // ターゲットまでの向きを計算
        const targetPos = this.getTargetPosition(target);
        const cp = this.body.position;
        const dx = targetPos.x - cp.x;
        const dz = targetPos.z - cp.z;
        const targetYaw = Math.atan2(dx, dz);
        
        // 回転方向を決定 & 適用
        const error = Math.atan2(
            Math.sin(targetYaw - this.yaw),
            Math.cos(targetYaw - this.yaw)
        );
        this.yaw += error * turnSpeed;
        this.body.quaternion.setFromEuler(0, this.yaw, 0);
    }

    /**
    * 突進待機状態を開始
    * @param {number} now - 現在の時間（ミリ秒）
    * @returns {void}　
    */
    startDashWarning(now) {
        this.isPreparingDash = true;
        this.dashWarningStartedAt = now;
        this.mesh.visible = true;
    }

    /**
    * 突進待機状態中の点滅アニメーション
    * @param {number} now - 現在の時間（ミリ秒）
    * @returns {void}　
    */
    updateDashWarning(now) {

        // BLINK_INTERVALごとにメッシュの表示/非表示を切り替える
        const elapsed = now - this.dashWarningStartedAt;
        const blinkCount = Math.floor(elapsed / Cube.DASH_BLINK_INTERVAL);
        this.mesh.visible = blinkCount % 2 === 0;

    }

    
    /**
    * 突進待機状態を解除
    * @param {void} 
    * @returns {void}　
    */
    finishDashWarning() {
        this.isPreparingDash = false; // 突進待機状態を解除
        this.mesh.visible = true;     // メッシュを表示
    }

    /**
    * ターゲットを追跡
    * @param {Ball} target - ターゲット(操作対象のボール)
    * @returns {void}　
    */
    chase(target) {

        // 姿勢制御
        const difficultyName = DifficultyNames[this.difficulty];
        const turnSpeed = Cube.TURN_SPEED[difficultyName];
        this.turnTowardTarget(target, turnSpeed);

        // 追跡
        const chaseForce = Cube.CHACE_FORCE[difficultyName];
        const fx = Math.sin(this.yaw) * chaseForce;
        const fz = Math.cos(this.yaw) * chaseForce;
        const forceVector = new CANNON.Vec3(fx, 0, fz);
        this.applyForce(forceVector);
    }

    /**
    * 突進
    * @param {void} 
    * @returns {void}　
    */
    dash(){
        const difficultyName = DifficultyNames[this.difficulty];
        const dashForce = Cube.DASH_FORCE[difficultyName];
        
        const fx = Math.sin(this.yaw) * dashForce;
        const fz = Math.cos(this.yaw) * dashForce;

        const force = new CANNON.Vec3(fx, 0, fz);

        this.applyImpulse(force);
    }

}
