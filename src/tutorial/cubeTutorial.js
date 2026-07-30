import { world } from '../core/physics.js';
import { getGameTime } from '../core/gameClock.js';
import { TutorialController } from './tutorialController.js';

/** Cube用チュートリアル。練習開始まではCubeを物理世界から外す。 */
export class CubeTutorial extends TutorialController {

    static WARNING_STATE_EXPLANATION_DURATION = 2000;

    warningStateStep = {
        id: 'warningState',
        show: 'showWarningStateExplanation',
        begin: 'beginWarningState',
        update: 'updateWarningState'
    };

    constructor(cube) {
        super(cube, 'Cube', {
            danger: '赤い面',
            safe: '赤い面以外の面',
            weak: '黄色い面'
        });
        this.hideEnemy();
        this.steps.push(this.warningStateStep);
    }

    /** 練習開始までCubeを物理ワールドと画面から隠す。 */
    hideEnemy() {
        if (world.bodies.includes(this.enemy.body)) {
            world.removeBody(this.enemy.body);
        }
        this.enemy.mesh.visible = false;
        this.enemyVisible = false;
    }

    /** Cubeを初期位置へ戻して物理ワールドと画面へ表示する。 */
    showEnemy() {
        const body = this.enemy.body;

        // ボールの初期位置(原点)と重ならないz=-6へ戻してから出現させる
        this.resetEnemyPosition();

        if (!world.bodies.includes(body)) {
            world.addBody(body);
        }

        this.enemy.mesh.visible = true;
        this.enemy.updateVisuals();
        this.enemyVisible = true;
    }

    /** Cubeの位置・速度・姿勢を戦闘開始時の状態へ戻す。 */
    resetEnemyPosition() {
        const { x, z, h } = this.enemy.constructor.initialPosition;
        const body = this.enemy.body;

        body.position.set(x, h / 2, z);
        body.quaternion.set(0, 0, 0, 1);
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        body.force.set(0, 0, 0);
        body.torque.set(0, 0, 0);
        body.aabbNeedsUpdate = true;
        body.wakeUp();
        this.enemy.yaw = 0;

        if (this.enemyVisible) this.enemy.updateVisuals();
    }

    /**
     * 通常戦闘と同じ追跡処理を練習対象へ適用する。
     * @param {Ball} ball - 追跡対象
     */
    chaseTarget(ball) {
        this.enemy.chase(ball);
    }

    /** 突進前に点滅する意味を説明する。 */
    showWarningStateExplanation() {
        const title = '点滅状態';
        const description = '点滅状態は敵が突進の準備をしている合図です';
        this.showStepOverlay(title, description);
    }

    /** 点滅状態の実演を開始する。 */
    beginWarningState() {
        const now = getGameTime();
        this.warningStateExplanationStartedAt = now;
        this.showEnemy();
        this.enemy.startDashWarning(now);
    }

    /**
     * 点滅を更新し、実演時間が終わったか判定する。
     * @returns {boolean} 実演が完了した場合はtrue
     */
    updateWarningState() {
        const now = getGameTime();
        // 敵が突進する前にチュートリアルが終了した場合、敵を消す
        this.enemy.updateDashWarning(now);
        if (
            now - this.warningStateExplanationStartedAt
                > CubeTutorial.WARNING_STATE_EXPLANATION_DURATION
        ) {
            this.hideEnemy();
            return true;
        }
        this.enemy.updateVisuals();
        return false;
    }

}
