import { DynamicObject } from "./dynamicObject.js";
import { createSnakeBody, world } from "../core/physics.js";
import {
    createSnakeMesh,
    createLightRayMesh
} from "../core/renderer.js";
import {
    Difficulty,
    DifficultyNames,
    FIELD_RADIUS,
    MIN_DAMAGE_IMPACT_SPEED
} from "../constants.js";
import { showHpBar, updateHpBar } from "../ui/hpBar.js";
import { SnakeTutorial } from "../tutorial/snakeTutorial.js";
import { getGameTime } from "../core/gameClock.js";
import { playEnemyHitSfx } from "../audioManager.js";

export class Snake extends DynamicObject {

    static CHASE_FORCE = {                // 難易度ごとの追跡時に与える力
        'Tutorial': 77,
        'Easy': 70,
        'Normal': 77,
        'Hard': 85
    };
    static MAX_HP = {                          // 難易度ごとの最大HP
        'Tutorial': 100,
        'Easy': 50,
        'Normal': 90,
        'Hard': 150
    };
    static CHASE_SWAY_FREQUENCY = 0.8;    // 追跡時に1秒間で左右へ揺れる回数
    static CHASE_SWAY_STRENGTH = 1;    // 追跡方向に対する横方向の力の割合
    static WEAK_SEGMENT_DAMAGE_COEF = 3;  // 弱点セグメントへのダメージ倍率

    static LIGHT_RAY_WARNING_DURATION = { // 光線発射前の予兆時間
        'Easy': 1500,
        'Normal': 1200,
        'Hard': 1000
    };
    static LIGHT_RAY_SPEED = {            // 光線が伸びる速さ
        'Tutorial': 50,
        'Easy': 50,
        'Normal': 90,
        'Hard': 150
    };
    static LIGHT_RAY_RADIUS = 0.15;       // 光線の半径（描画・当たり判定共通）
    static LIGHT_RAY_MAX_DISTANCE = FIELD_RADIUS * 2.5;
    static LIGHT_RAY_COOLDOWN = 4000;     // 光線発射後の再待機時間
    // 光線が目標地点へ到達した後、その場に表示しておく時間
    static LIGHT_RAY_DURATION = 300;
    static WARNING_BLINK_INTERVAL = 150;  // 予兆中の点滅周期
    static WARNING_HEAD_LIFT = 4.0;       // 予兆中に持ち上げる頭の高さ
    static HEAD_LIFT_LERP = 0.1;          // 頭の上下移動を補間する係数
    static WARNING_HEAD_CENTER_APPROACH = 0.3; // 予兆中に体の中心へ寄せる量
    static HEAD_CENTER_APPROACH_LERP = 0.12;   // 頭のXZ寄せを補間する係数


    static initialPosition = { x: 0, z: -10 }; // 初期配置

    constructor(difficulty) {

        super();
        const { x, z } = Snake.initialPosition;

        this.radius = 2;            // 各セグメントの半径
        this.segmentCount = 7;      // セグメント数
        this.difficulty = difficulty;

        // 頭以外のセグメントから弱点を1つ選ぶ
        this.weakSegmentIndex = 1 + Math.floor(
            Math.random() * (this.segmentCount - 1)
        );

        // 物理演算用の蛇本体を生成
        const snake = createSnakeBody(
            x,
            z,
            this.radius,
            this.segmentCount
        );

        this.bodies = snake.bodies;
        this.constraints = snake.constraints;

        // 光線の見た目を表すメッシュを生成
        this.lightRayMesh = createLightRayMesh(Snake.LIGHT_RAY_RADIUS);

        // 光線描画で使う一時ベクトル
        this.rayDirection = new THREE.Vector3();
        this.rayMidPoint = new THREE.Vector3();
        this.rayYAxis = new THREE.Vector3(0, 1, 0);
        this.lightRayStart = new THREE.Vector3();
        this.lightRayTarget = new THREE.Vector3();
        this.lightRayCurrentEnd = new THREE.Vector3();
        this.lightRayDesiredEnd = new THREE.Vector3();
        this.lightRayHitPoint = new THREE.Vector3();
        this.lightRayObstacleHitPoint = new THREE.Vector3();
        this.hasLightRayObstacleHit = false;
        this.rayToBall = new THREE.Vector3();
        this.rayClosestPoint = new THREE.Vector3();
        this.ballPosition = new THREE.Vector3();

        this.difficulty = Number(difficulty);

        // 描画用メッシュを生成
        this.meshes = createSnakeMesh(
            x,
            z,
            this.radius,
            this.segmentCount,
            this.weakSegmentIndex
        );

        const difficultyName = DifficultyNames[this.difficulty];
        this.maxHp = Snake.MAX_HP[difficultyName] ?? Snake.MAX_HP.Hard;

        this.hp = this.maxHp;
        this.isBattleFinished = false; // 勝敗が確定したかどうか
        this.faceYaw = 0;              // 頭の向き
        this.tutorial = null;

        // 追跡時の蛇行運動に使用する状態
        this.chaseSwayPhase = 0;
        this.lastChaseUpdateTime = getGameTime();

        // 光線発射の状態管理
        this.lastLightRayTime = getGameTime();
        this.isPreparingLightRay = false;
        this.isFiringLightRay = false;
        this.lightRayWarningStartedAt = 0;
        this.lightRayStartedAt = 0;
        this.lightRayTravelDuration = 0;
        this.lightRayStoppedAt = 0;
        this.headVisualLift = 0;
        this.headCenterApproach = 0;
        // 頭部演出として物理ボディへ適用済みの位置差分。
        this.appliedHeadLift = 0;
        this.appliedHeadCenterOffsetX = 0;
        this.appliedHeadCenterOffsetZ = 0;
        this.isHeadPoseControlled = false;

        if (this.difficulty !== Difficulty.TUTORIAL) {
            showHpBar();
        }

        // 各セグメントに衝突イベントを登録する
        this.bodies.forEach((body, segmentIndex) => {
            body.addEventListener(
                'collide',
                (event) => this.handleCollisionEvent(event, segmentIndex)
            );
        });

        // Tutorial選択時だけ、Snake専用チュートリアルを開始する
        if (this.difficulty === Difficulty.TUTORIAL) {
            this.tutorial = new SnakeTutorial(this);
        }

    }

    /**
    * セグメントごとの衝突イベントを処理する
    * @param {CANNON.Event} event - 衝突イベント
    * @param {number} segmentIndex - 衝突したセグメント番号
    * @returns {void}
    */
    handleCollisionEvent(event, segmentIndex) {
        if (this.isBattleFinished || event.body.name !== 'ball') return;

        // 赤い頭は攻撃部位。通常ゲームでは触れた時点でゲームオーバー
        if (segmentIndex === 0) {
            // チュートリアル中は終了させず、危険部位の警告を表示する
            if (this.difficulty === Difficulty.TUTORIAL) {
                this.tutorial?.notifyDangerCollision();
                return;
            }

            this.isBattleFinished = true;
            const gameOverEvent = new CustomEvent('game-over');
            window.dispatchEvent(gameOverEvent);
            return;
        }

        const impactSpeed = Math.abs(
            event.contact.getImpactVelocityAlongNormal()
        );

        if (impactSpeed < MIN_DAMAGE_IMPACT_SPEED) return;

        let damage = impactSpeed;

        const isWeakPoint = segmentIndex === this.weakSegmentIndex;

        if (isWeakPoint) {
            damage *= Snake.WEAK_SEGMENT_DAMAGE_COEF;
        }

        this.applyDamage(damage);
        playEnemyHitSfx(isWeakPoint);
        updateHpBar((this.hp / this.maxHp) * 100);
        this.tutorial?.notifyDamage(damage, { isWeakPoint });
    }

    /**
    * HPを減らし、0以下になったら勝利イベントを送る
    * @param {number} damage - 受けたダメージ量
    * @returns {void}
    */
    applyDamage(damage) {
        this.hp = Math.max(0, this.hp - damage);

        // チュートリアルの完了条件はTutorialController側で管理する
        if (this.difficulty === Difficulty.TUTORIAL) return;

        if (this.hp > 0) return;

        this.isBattleFinished = true;

        const gameClearEvent = new CustomEvent('game-clear');

        window.dispatchEvent(gameClearEvent);
    }

    /**
    * 1フレーム分の更新処理
    * @param {Ball} target - 操作対象のボール
    * @returns {void}
    */
    update(target){
        const now = getGameTime();

        // チュートリアル中は通常の追跡・光線攻撃を停止する
        if (this.tutorial) {
            this.tutorial.update(target);
            if (this.tutorial.enemyVisible) this.updateVisuals();
            return;
        }

        // 物理演算
        this.updateBehavior(target, now);
        // ビジュアル更新
        this.updateVisuals();
        // 発射後の一定時間だけ光線を表示
        if (this.updateLightRay(now, target)) {
            this.isBattleFinished = true;
            window.dispatchEvent(new CustomEvent('game-over'));
        }
    }

    /**
    * 行動状態を更新する
    * @param {Ball} target - 操作対象のボール
    * @param {number} now - 現在時刻
    * @returns {void}
    */
    updateBehavior(target, now) {
        const difficultyName = DifficultyNames[this.difficulty];

        // 発射中は追跡も角度更新も行わず、発射時の顔の向きを維持する
        if (this.isFiringLightRay) return;

        // 光線の予兆中は移動せず、ターゲットの方向を向くだけにする
        if (this.isPreparingLightRay) {
            this.faceTarget(target);
            this.updateLightRayWarning(now);

            const warningDuration =
                Snake.LIGHT_RAY_WARNING_DURATION[difficultyName];

            if (now - this.lightRayWarningStartedAt >= warningDuration) {
                this.finishLightRayWarning();
                this.fireLightRay(target, now);
                this.lastLightRayTime = now;
            }
            return;
        }

        // クールダウン終了後、光線の予兆状態へ移行する
        if (now - this.lastLightRayTime >= Snake.LIGHT_RAY_COOLDOWN) {
            this.startLightRayWarning(now);
            this.faceTarget(target);
            return;
        }

        this.chase(target, now);
    }

    /**
    * 頭がターゲットの方向を向くようにする
    * @param {Ball} target - 操作対象のボール
    * @returns {void}
    */
    faceTarget(target) {
        const targetPos = this.getTargetPosition(target);
        const headPosition = this.bodies[0].position;
        const dx = targetPos.x - headPosition.x;
        const dz = targetPos.z - headPosition.z;
        this.faceYaw = Math.atan2(dx, dz);
    }

    /**
    * 光線発射の予兆状態に入る
    * @param {number} now - 現在時刻
    * @returns {void}
    */
    startLightRayWarning(now) {
        this.isPreparingLightRay = true;
        this.lightRayWarningStartedAt = now;
        this.setMeshesVisible(true);
    }

    /**
    * 予兆中の点滅表示を更新する
    * @param {number} now - 現在時刻
    * @returns {void}
    */
    updateLightRayWarning(now) {
        const elapsed = now - this.lightRayWarningStartedAt;
        const blinkCount = Math.floor(
            elapsed / Snake.WARNING_BLINK_INTERVAL
        );
        this.setMeshesVisible(blinkCount % 2 === 0);
    }

    /**
    * 光線発射の予兆を終了する
    * @returns {void}
    */
    finishLightRayWarning() {
        this.isPreparingLightRay = false;
        this.setMeshesVisible(true);
    }

    /**
    * 全セグメントの表示・非表示をまとめて切り替える
    * @param {boolean} visible - 表示するかどうか
    * @returns {void}
    */
    setMeshesVisible(visible) {
        this.meshes.forEach((mesh) => {
            mesh.visible = visible;
        });
    }

    /**
    * 光線発射時の始点と進行方向を記録する
    * @param {Ball} target - 操作対象のボール
    * @param {number} now - 現在時刻
    * @returns {void}
    */
    fireLightRay(target, now) {
        const targetPosition = target.body.position;

        // ボールの現在位置は進行方向を決めるためだけに使用する。
        // 終点はフィールドを横断できる十分遠い位置に置く。
        this.lightRayStart.copy(this.meshes[0].position);
        this.lightRayTarget.set(
            targetPosition.x,
            targetPosition.y,
            targetPosition.z
        );
        this.rayDirection
            .subVectors(this.lightRayTarget, this.lightRayStart)
            .normalize();
        this.lightRayTarget
            .copy(this.rayDirection)
            .multiplyScalar(Snake.LIGHT_RAY_MAX_DISTANCE)
            .add(this.lightRayStart);

        const difficultyName = DifficultyNames[this.difficulty];
        const lightRaySpeed = Snake.LIGHT_RAY_SPEED[difficultyName];

        this.lightRayTravelDuration =
            Snake.LIGHT_RAY_MAX_DISTANCE / lightRaySpeed * 1000;
        this.lightRayStartedAt = now;
        this.lightRayStoppedAt = 0;
        this.isFiringLightRay = true;

        // 静的な障害物との衝突地点は、発射時に一度だけ求める。
        const obstacleHitPoint = this.findLightRayCollision(
            this.lightRayTarget,
            target
        );
        this.hasLightRayObstacleHit = Boolean(obstacleHitPoint);
        if (obstacleHitPoint) {
            this.lightRayObstacleHitPoint.copy(obstacleHitPoint);
        }
    }

    /**
    * 光線メッシュの見た目を更新する
    * @param {number} now - 現在時刻
    * @param {Ball} target - 当たり判定を行うボール
    * @returns {boolean} ボールに命中した場合はtrue
    */
    updateLightRay(now, target) {
        if (!this.isFiringLightRay) {
            this.lightRayMesh.visible = false;
            return false;
        }

        const elapsed = now - this.lightRayStartedAt;
        const progress = this.lightRayTravelDuration > 0
            ? Math.min(elapsed / this.lightRayTravelDuration, 1)
            : 1;

        // 発射方向へ光線を伸ばし、発射時に記録した衝突点で停止する
        this.lightRayDesiredEnd.lerpVectors(
            this.lightRayStart,
            this.lightRayTarget,
            progress
        );
        if (!this.lightRayStoppedAt) {
            const reachedObstacle = this.hasLightRayObstacleHit
                && this.lightRayStart.distanceToSquared(this.lightRayDesiredEnd)
                    >= this.lightRayStart.distanceToSquared(this.lightRayObstacleHitPoint);

            if (reachedObstacle) {
                this.lightRayCurrentEnd.copy(this.lightRayObstacleHitPoint);
                this.lightRayStoppedAt = now;
            } else {
                this.lightRayCurrentEnd.copy(this.lightRayDesiredEnd);
                if (progress >= 1) this.lightRayStoppedAt = now;
            }
        }
        this.emitLightRay(this.lightRayStart, this.lightRayCurrentEnd);

        // 命中後の扱いは通常戦闘とチュートリアルで呼び出し側が決める
        if (this.isLightRayHittingTarget(target)) {
            this.isFiringLightRay = false;
            this.lightRayMesh.visible = false;
            return true;
        }

        if (
            this.lightRayStoppedAt
            && now - this.lightRayStoppedAt >= Snake.LIGHT_RAY_DURATION
        ) {
            this.isFiringLightRay = false;
            this.lightRayMesh.visible = false;
        }

        return false;
    }

    /**
    * 光線の始点から現在の伸長予定位置までで最初に衝突する地点を返す
    * @param {THREE.Vector3} endPosition - 現在フレームの伸長予定位置
    * @param {Ball} target - ボール（既存の線分判定で別途処理する）
    * @returns {THREE.Vector3|null} 衝突地点。衝突しない場合はnull
    */
    findLightRayCollision(endPosition, target) {
        const from = new CANNON.Vec3(
            this.lightRayStart.x,
            this.lightRayStart.y,
            this.lightRayStart.z
        );
        const to = new CANNON.Vec3(
            endPosition.x,
            endPosition.y,
            endPosition.z
        );
        let closestDistance = Infinity;
        let hasHit = false;

        world.raycastAll(from, to, { skipBackfaces: true }, (result) => {
            // 発射元のSnake自身と、独自判定を持つボールは終点にしない
            if (
                this.bodies.includes(result.body)
                || result.body === target?.body
            ) return;

            if (result.distance >= closestDistance) return;

            closestDistance = result.distance;
            this.lightRayHitPoint.set(
                result.hitPointWorld.x,
                result.hitPointWorld.y,
                result.hitPointWorld.z
            );
            hasHit = true;
        });

        return hasHit ? this.lightRayHitPoint : null;
    }

    /**
    * 現在の光線を線分、ボールを球として接触判定を行う
    * @param {Ball} target - 判定対象のボール
    * @returns {boolean} 光線とボールが接触している場合はtrue
    */
    isLightRayHittingTarget(target) {
        if (this.isBattleFinished || !target?.body) return false;

        // 光線の始点から終点へのベクトルを求める
        this.rayDirection.subVectors(
            this.lightRayCurrentEnd,
            this.lightRayStart
        );

        const rayLengthSquared = this.rayDirection.lengthSq();
        if (rayLengthSquared < 0.000001) return false;

        this.ballPosition.set(
            target.body.position.x,
            target.body.position.y,
            target.body.position.z
        );

        // ボールに最も近い光線上の位置を0～1の範囲で求める
        this.rayToBall.subVectors(this.ballPosition, this.lightRayStart);
        const closestRate = THREE.MathUtils.clamp(
            this.rayToBall.dot(this.rayDirection) / rayLengthSquared,
            0,
            1
        );

        this.rayClosestPoint
            .copy(this.rayDirection)
            .multiplyScalar(closestRate)
            .add(this.lightRayStart);

        // Cannonの球形状からボール半径を取得する
        const ballShape = target.body.shapes?.[0];
        const ballRadius = ballShape?.radius
            ?? ballShape?.boundingSphereRadius
            ?? 1;
        const collisionRadius = ballRadius + Snake.LIGHT_RAY_RADIUS;

        return this.rayClosestPoint.distanceToSquared(this.ballPosition)
            <= collisionRadius * collisionRadius;
    }

    /**
    * ボールへ向かって移動しつつ、通常時の顔の向きも更新する
    * @param {Ball} target - 操作対象のボール
    * @param {number} now - 現在時刻
    * @returns {void}
    */
    chase(target, now) {


        const targetPos = this.getTargetPosition(target);

        const head = this.bodies[0];

        const p = head.position;

        const dx = targetPos.x - p.x;
        const dz = targetPos.z - p.z;

        const distance = Math.hypot(dx, dz);

        if (distance < 0.001) return;

        // 通常追跡中は従来どおり、常にボールの方向へ顔を向ける
        this.faceYaw = Math.atan2(dx, dz);

        // フレーム間隔から蛇行の位相を進める
        // 予兆や発射を挟んだ後に急激に位相が飛ばないよう、最大値を制限する
        const deltaSeconds = Math.min(
            Math.max((now - this.lastChaseUpdateTime) / 1000, 0),
            0.05
        );
        this.lastChaseUpdateTime = now;
        this.chaseSwayPhase +=
            Math.PI * 2 * Snake.CHASE_SWAY_FREQUENCY * deltaSeconds;

        // ボールへ向かう単位ベクトル
        const forwardX = dx / distance;
        const forwardZ = dz / distance;

        // 進行方向に対して直角のベクトルへ周期的な力を加える
        const sideX = forwardZ;
        const sideZ = -forwardX;
        const sway = Math.sin(this.chaseSwayPhase)
            * Snake.CHASE_SWAY_STRENGTH;

        const moveX = forwardX + sideX * sway;
        const moveZ = forwardZ + sideZ * sway;
        const moveLength = Math.hypot(moveX, moveZ);

        const difficultyName = DifficultyNames[this.difficulty];
        const chaseForce = Snake.CHASE_FORCE[difficultyName];

        // 合成後も力の大きさが一定になるように正規化する
        const fx = moveX / moveLength * chaseForce;
        const fz = moveZ / moveLength * chaseForce;

        const forceVector = new CANNON.Vec3(fx, 0, fz);

        this.applyForce(forceVector, head);
    }

    /**
    * レーザー演出中の頭部位置を物理ボディへ適用し、
    * 全セグメントのビジュアルを物理演算の結果に合わせて更新する
    * @returns {void}
    */
    updateVisuals() {
        const isLightRaySequenceActive =
            this.isPreparingLightRay || this.isFiringLightRay;
        const targetHeadLift = isLightRaySequenceActive
            ? Snake.WARNING_HEAD_LIFT
            : 0;
        const targetHeadCenterApproach = isLightRaySequenceActive
            ? Snake.WARNING_HEAD_CENTER_APPROACH
            : 0;

        this.headVisualLift = THREE.MathUtils.lerp(
            this.headVisualLift,
            targetHeadLift,
            Snake.HEAD_LIFT_LERP
        );
        this.headCenterApproach = THREE.MathUtils.lerp(
            this.headCenterApproach,
            targetHeadCenterApproach,
            Snake.HEAD_CENTER_APPROACH_LERP
        );

        const head = this.bodies[0];
        const shouldControlHeadPose =
            isLightRaySequenceActive
            || this.headVisualLift > 0.01
            || this.headCenterApproach > 0.001;

        if (shouldControlHeadPose && !this.isHeadPoseControlled) {
            // 動的ボディのままでは距離拘束に引き戻されるため、
            // 演出中だけ位置を直接制御できるキネマティックボディにする。
            head.type = CANNON.Body.KINEMATIC;
            head.velocity.set(0, 0, 0);
            head.angularVelocity.set(0, 0, 0);
            head.updateMassProperties();
            this.isHeadPoseControlled = true;
        }

        // 前フレームに演出として加えた差分を除いた頭部の基準位置。
        const baseHeadX =
            head.position.x - this.appliedHeadCenterOffsetX;
        const baseHeadZ =
            head.position.z - this.appliedHeadCenterOffsetZ;

        // 質量を考慮せず、演出前の頭部を含む全セグメントのXZ平均を求める。
        let bodyCenterX = 0;
        let bodyCenterZ = 0;

        for (let i = 0; i < this.bodies.length; i++) {
            bodyCenterX += i === 0
                ? baseHeadX
                : this.bodies[i].position.x;
            bodyCenterZ += i === 0
                ? baseHeadZ
                : this.bodies[i].position.z;
        }

        bodyCenterX /= this.bodies.length;
        bodyCenterZ /= this.bodies.length;

        const nextCenterOffsetX =
            (bodyCenterX - baseHeadX) * this.headCenterApproach;
        const nextCenterOffsetZ =
            (bodyCenterZ - baseHeadZ) * this.headCenterApproach;

        // 前フレームから変化した演出量だけを加え、物理挙動による移動は保持する。
        head.position.x +=
            nextCenterOffsetX - this.appliedHeadCenterOffsetX;
        head.position.y +=
            this.headVisualLift - this.appliedHeadLift;
        head.position.z +=
            nextCenterOffsetZ - this.appliedHeadCenterOffsetZ;
        head.aabbNeedsUpdate = true;
        head.wakeUp();

        this.appliedHeadLift = this.headVisualLift;
        this.appliedHeadCenterOffsetX = nextCenterOffsetX;
        this.appliedHeadCenterOffsetZ = nextCenterOffsetZ;

        if (!shouldControlHeadPose && this.isHeadPoseControlled) {
            // 演出位置から戻り切った後に、通常の動的な頭部へ復帰する。
            head.position.x -= this.appliedHeadCenterOffsetX;
            head.position.y -= this.appliedHeadLift;
            head.position.z -= this.appliedHeadCenterOffsetZ;
            this.headVisualLift = 0;
            this.headCenterApproach = 0;
            this.appliedHeadLift = 0;
            this.appliedHeadCenterOffsetX = 0;
            this.appliedHeadCenterOffsetZ = 0;
            head.type = CANNON.Body.DYNAMIC;
            head.updateMassProperties();
            head.wakeUp();
            this.isHeadPoseControlled = false;
        }

        // スネークの各セグメントの位置と姿勢を物理演算の結果に合わせて更新
        for (let i = 0; i < this.bodies.length; i++) {
            this.meshes[i].position.copy(
                this.bodies[i].position
            );
            // 頭のセグメントは物理位置を使い、顔の向きだけ独自に設定する。
            if (i === 0) {
                this.meshes[i].rotation.set(0, this.faceYaw, 0); 
                continue;
            }
            this.meshes[i].quaternion.copy(
                this.bodies[i].quaternion
            );
        }
    }

    /**
    * 光線メッシュを始点と終点の間に配置する
    * @param {THREE.Vector3} startPosition - 光線の始点
    * @param {THREE.Vector3} endPosition - 光線の現在の終点
    * @returns {void}
    */
    emitLightRay(startPosition, endPosition) {

        // 光線のメッシュを取得(コンストラクタで作成済み)
        const mesh = this.lightRayMesh;

        // 始点と終点の差分をとることにより、光線の方向ベクトルを計算
        this.rayDirection.subVectors(endPosition, startPosition);

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
            .addVectors(startPosition, endPosition)
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
