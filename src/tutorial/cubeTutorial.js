import { world } from '../core/physics.js';
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

    

    dashStep = {
        id: "dash",
        show: "showDashExplanation",
        begin: "beginDash",
        update: "updateDash"
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

    hideEnemy() {
        if (world.bodies.includes(this.enemy.body)) {
            world.removeBody(this.enemy.body);
        }
        this.enemy.mesh.visible = false;
        this.enemyVisible = false;
    }

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

    chaseTarget(ball) {
        this.enemy.chase(ball);
    }


    showWarningStateExplanation() {
        const title = '点滅状態';
        const description = '点滅状態は敵が突進の準備をしている合図です';
        this.showStepOverlay(title, description);
    }

    beginWarningState() {
        this.waringStateExplanationStartTime = performance.now();
        this.showEnemy();
        this.enemy.startDashWarning(performance.now());
    }

    updateWarningState() {
        // 敵が突進する前にチュートリアルが終了した場合、敵を消す
        this.enemy.updateDashWarning(performance.now());
        if(performance.now() - this.waringStateExplanationStartTime > CubeTutorial.WARNING_STATE_EXPLANATION_DURATION) {
            this.hideEnemy();
            return true;
        }
        this.enemy.updateVisuals();
        return false;
    }

    showDashExplanation() {
        const title = '突進';
        const description = '点滅状態の後、敵は突進してきます。赤い面に触れるとゲームオーバーです';
        this.showStepOverlay(title, description);
    }

    beginDash() {
        this.showEnemy();
        this.enemy.startDash(performance.now());
    }

}
