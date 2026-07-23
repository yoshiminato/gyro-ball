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

        if (this.enemyVisible) this.enemy.updateVisuals();
    }



    showWarningStateExplanation() {
        const title = '点滅状態';
        const description = '点滅状態は敵がレーザーを放つ準備をしている合図です';
        this.ball.reset();
        this.showStepOverlay(title, description);
        this.showEnemy();
        const now = getGameTime();
        this.waringStartTime = now;
        this.enemy.startLightRayWarning(now);
    }

    updateWaitingWarningState(target) {
        const now = getGameTime();
        this.enemy.updateLightRayWarning(now);
        this.enemy.faceTarget(target);
    }

    beginWarningState() {
        this.waringStartTime = getGameTime();
        // this.showEnemy();
        this.enemy.startLightRayWarning(getGameTime());
    }

    updateWarningState(target) {
        this.enemy.updateLightRayWarning(getGameTime());
        this.enemy.faceTarget(target);
        if (getGameTime() - this.waringStartTime >= this.warningStateDuration) {
            // this.hideEnemy();
            return true; 
        }
        return false;
    }

    showLightRayExplanation() {
        const title = '光線';
        const description = '敵がレーザーを放ってきます。移動して回避しましょう';
        this.showStepOverlay(title, description);
    }

    beginLightRay() {
        this.warningStateStartTime = getGameTime();
        this.enemy.isPreparingLightRay = false;
        this.enemy.isFiringLightRay = false;
        this.enemy.lightRayMesh.visible = false;
        // this.showEnemy();
        this.enemy.startLightRayWarning(this.warningStateStartTime);
    }

    updateWhileLightRayWaiting(target) {
        const now = getGameTime();
        this.enemy.updateLightRayWarning(now);
        this.enemy.faceTarget(target);
    }

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

    /** 光線に当たった場合、通常のゲームオーバーにはせず同じ練習をやり直す。 */
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
}
