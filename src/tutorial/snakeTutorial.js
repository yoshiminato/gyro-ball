import { world } from '../core/physics.js';
import { TutorialController } from './tutorialController.js';
import { getGameTime } from '../core/gameClock.js';

/** Snake用チュートリアル。練習開始までは全セグメントを物理世界から外す。 */
export class SnakeTutorial extends TutorialController {


    warningStateDuration = 2000;
    warningStateStep = {
        id: 'warningState',
        show: 'showWarningStateExplanation',
        begin: 'beginWarningState',
        updateWaiting: 'updateWaitingWarningState',
        update: 'updateWarningState'
    };

    lightRayStep = {
        id: 'lightRay',
        show: 'showLightRayExplanation',
        begin: 'beginLightRay',
        updateWaiting: 'updateWhileLightRayWaiting',
        update: 'updateLightRay'
    }

    constructor(snake) {
        super(snake, 'Snake', {
            danger: '赤い頭',
            safe: '頭以外の体',
            weak: '黄色いセグメント'
        });
        this.steps.push(this.warningStateStep);
        this.steps.push(this.lightRayStep);

        // 拘束でつながった全セグメントを同じ配置へ戻せるよう保存する
        this.initialBodyTransforms = snake.bodies.map((body) => ({
            position: body.position.clone(),
            quaternion: body.quaternion.clone()
        }));
        this.hideEnemy();
    }

    /** Snakeの拘束と全セグメントを物理ワールドから外して非表示にする。 */
    hideEnemy() {
        this.enemy.constraints.forEach((constraint) => {
            if (world.constraints.includes(constraint)) {
                world.removeConstraint(constraint);
            }
        });

        this.enemy.bodies.forEach((body) => {
            if (world.bodies.includes(body)) {
                world.removeBody(body);
            }
        });

        this.enemy.setMeshesVisible(false);
        this.enemy.lightRayMesh.visible = false;
        this.enemyVisible = false;
    }

    /** Snakeを初期配置へ戻し、拘束と全セグメントを再登録する。 */
    showEnemy() {
        // 頭がz=-6にある初期配置へ戻し、原点のボールと重ならないようにする
        this.resetEnemyPosition();

        this.enemy.bodies.forEach((body) => {
            if (!world.bodies.includes(body)) {
                world.addBody(body);
            }
        });

        this.enemy.constraints.forEach((constraint) => {
            if (!world.constraints.includes(constraint)) {
                world.addConstraint(constraint);
            }
        });

        this.enemy.setMeshesVisible(true);
        this.enemy.updateVisuals();
        this.enemyVisible = true;
    }

    /** 全セグメントの位置・姿勢・速度を保存済みの初期状態へ戻す。 */
    resetEnemyPosition() {
        // super()の実行中はまだ初期配置を保存していないため何もしない
        if (!this.initialBodyTransforms) return;

        this.enemy.bodies.forEach((body, index) => {
            const initialTransform = this.initialBodyTransforms[index];
            body.position.copy(initialTransform.position);
            body.quaternion.copy(initialTransform.quaternion);
            body.velocity.set(0, 0, 0);
            body.angularVelocity.set(0, 0, 0);
            body.force.set(0, 0, 0);
            body.torque.set(0, 0, 0);
            body.aabbNeedsUpdate = true;
            body.wakeUp();
        });

        // 初期座標には頭部演出の差分が含まれないため、適用量も初期化する。
        this.enemy.headVisualLift = 0;
        this.enemy.headCenterApproach = 0;
        this.enemy.appliedHeadLift = 0;
        this.enemy.appliedHeadCenterOffsetX = 0;
        this.enemy.appliedHeadCenterOffsetZ = 0;
        this.enemy.isHeadPoseControlled = false;
        this.enemy.bodies[0].type = CANNON.Body.DYNAMIC;
        this.enemy.bodies[0].updateMassProperties();

        if (this.enemyVisible) this.enemy.updateVisuals();
    }

    /** レーザー発射前に点滅する意味を説明し、その場で実演する。 */
    showWarningStateExplanation() {
        const title = '点滅状態';
        const description = '点滅状態は敵がレーザーを放つ準備をしている合図です';
        this.ball.reset();
        this.showStepOverlay(title, description);
        this.showEnemy();
        const now = getGameTime();
        this.warningStartedAt = now;
        this.enemy.startLightRayWarning(now);
    }

    /**
     * 説明オーバーレイの待機中も点滅と顔の向きを更新する。
     * @param {Ball} target - 顔を向ける対象
     */
    updateWaitingWarningState(target) {
        const now = getGameTime();
        this.enemy.updateLightRayWarning(now);
        this.enemy.faceTarget(target);
    }

    /** 点滅状態の実演時間を初期化する。 */
    beginWarningState() {
        this.warningStartedAt = getGameTime();
        this.enemy.startLightRayWarning(getGameTime());
    }

    /**
     * 点滅の実演を進め、規定時間が経過したか判定する。
     * @param {Ball} target - 顔を向ける対象
     * @returns {boolean} 実演が完了した場合はtrue
     */
    updateWarningState(target) {
        this.enemy.updateLightRayWarning(getGameTime());
        this.enemy.faceTarget(target);
        if (getGameTime() - this.warningStartedAt >= this.warningStateDuration) {
            return true; 
        }
        return false;
    }

    /** 点滅後に直線状のレーザーが発射されることを説明する。 */
    showLightRayExplanation() {
        const title = '光線';
        const description = '敵がレーザーを放ってきます。移動して回避しましょう';
        this.showStepOverlay(title, description);
    }

    /** レーザー回避練習の予兆状態を初期化する。 */
    beginLightRay() {
        this.warningStateStartTime = getGameTime();
        this.enemy.isPreparingLightRay = false;
        this.enemy.isFiringLightRay = false;
        this.enemy.lightRayMesh.visible = false;
        this.enemy.startLightRayWarning(this.warningStateStartTime);
    }

    /**
     * 説明確認待ちの間もレーザー予兆を更新する。
     * @param {Ball} target - 顔を向ける対象
     */
    updateWhileLightRayWaiting(target) {
        const now = getGameTime();
        this.enemy.updateLightRayWarning(now);
        this.enemy.faceTarget(target);
    }

    /**
     * 予兆、発射、命中、終了までのレーザー練習を進める。
     * @param {Ball} target - レーザーの対象
     * @returns {boolean} 回避練習が完了した場合はtrue
     */
    updateLightRay(target) {
        const now = getGameTime();

        if (this.enemy.isPreparingLightRay) {
            this.enemy.updateLightRayWarning(now);
            this.enemy.faceTarget(target);

            if (now - this.warningStateStartTime < this.warningStateDuration) {
                return false;
            }

            this.enemy.finishLightRayWarning();
            this.enemy.fireLightRay(target, now);
            this.enemy.lastLightRayTime = now;
            return false;
        }
        if (this.enemy.isFiringLightRay) {
            const isHit = this.enemy.updateLightRay(now, target);
            if (isHit) {
                this.retryLightRayPractice();
                return false;
            }
            return !this.enemy.isFiringLightRay;
        }

        return false;
    }

    /** 光線に当たった場合、ゲームオーバーにせず同じ練習をやり直す。 */
    retryLightRayPractice() {
        if (this.dangerNoticeOpen) return;

        this.dangerNoticeOpen = true;
        this.ball?.setInputEnabled(false);

        this.showOverlay(
            '光線に当たりました',
            'ボールと敵を初期位置に戻し、光線の回避をもう一度練習します。',
            'やり直す',
            () => {
                this.ball.resetPosition();
                this.resetEnemyPosition();
                this.dangerNoticeOpen = false;
                this.beginLightRay();
                this.ball.setInputEnabled(true);
            }
        );
    }

    /**
     * 通常戦闘と同じ蛇行追跡を練習対象へ適用する。
     * @param {Ball} target - 追跡対象
     */
    chaseTarget(target) {
        this.enemy.chase(target, getGameTime());
    }
}
