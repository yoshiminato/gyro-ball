import { showHpBar, updateHpBar } from '../ui/hpBar.js';
import { isMobileDevice } from '../util.js';

/**
 * CubeとSnakeで共通するチュートリアルの進行を管理する。
 * 敵の物理ボディを表示する方法だけ、各派生クラス側で実装する。
 */
export class TutorialController {

    static MOVE_DISTANCE = 10;
    static TURN_ANGLE = Math.PI / 2;
    static EVADE_DURATION = 10000;
    static EVADE_ENEMY_HP = 200;

    /**
     * チュートリアルの実行順。
     * show: その手順の説明表示
     * begin: OKが押されたときの初期化
     * update: 毎フレーム行う完了判定
     */
    steps = [
        // {
        //     id: 'movement',
        //     show: 'showMovementExplanation',
        //     begin: 'beginMovementPractice',
        //     update: 'updateMovementPractice'
        // },
        // {
        //     id: 'turn',
        //     show: 'showTurnExplanation',
        //     begin: 'beginTurnPractice',
        //     update: 'updateTurnPractice'
        // },
        // {
        //     id: 'jump',
        //     show: 'showJumpExplanation',
        //     begin: 'beginJumpPractice',
        //     update: 'updateJumpPractice'
        // },
        // {
        //     id: 'battle',
        //     show: 'showBattleExplanation',
        //     begin: 'beginBattlePractice',
        //     update: 'updateBattlePractice'
        // },
        // {
        //     id: 'weak-point',
        //     show: 'showWeakPointExplanation',
        //     begin: 'beginWeakPointPractice',
        //     update: 'updateWeakPointPractice'
        // },
        // {
        //     id: 'evade',
        //     show: 'showEvadeExplanation',
        //     begin: 'beginEvadePractice',
        //     update: 'updateEvadePractice'
        // }
    ];

    constructor(enemy, enemyName, partNames = {}) {
        this.enemy = enemy;
        this.enemyName = enemyName;
        this.dangerPartName = partNames.danger ?? '赤い攻撃部位';
        this.safePartName = partNames.safe ?? '攻撃部位以外の体';
        this.weakPartName = partNames.weak ?? '黄色い弱点';
        this.ball = null;
        this.overlay = null;
        this.enemyVisible = false;
        this.isMobile = isMobileDevice();

        // STEPSの何番目を実行しているかを表す。
        this.stepIndex = 0;
        this.stepState = 'not-started';

        // 各練習の完了判定に使う状態。
        this.traveledDistance = 0;
        this.previousBallPosition = null;
        this.turnedAngle = 0;
        this.previousHeading = null;
        this.jumpStartCount = 0;
        this.hasLeftGround = false;
        this.evadeStartedAt = 0;
        this.battleDamageReceived = false;
        this.weakPointHit = false;
        this.dangerNoticeOpen = false;
    }

    /** 現在実行中の手順を返す。 */
    get currentStep() {
        return this.steps[this.stepIndex] ?? null;
    }

    /** Cube側の既存の完了判定からも参照できるようにする。 */
    get phase() {
        if (!this.currentStep) return 'completed';
        return this.currentStep.id;
    }

    /**
     * 現在の手順の説明・練習・完了判定を一か所で進行する。
     * @param {Ball} ball - プレイヤーが操作するボール
     */
    update(ball) {
        this.ball = ball;

        if (this.dangerNoticeOpen) {
            ball.setInputEnabled(false);
            return;
        }

        // 最後の手順まで終わったら完了画面を表示する。
        if (!this.currentStep) {
            ball.setInputEnabled(false);

            if (this.stepState !== 'completed') {
                this.stepState = 'completed';
                this.showTutorialCompletion();
            }
            return;
        }

        // 新しい手順に入った最初のフレームで説明を表示する。
        if (this.stepState === 'not-started') {
            ball.setInputEnabled(false);
            this.stepState = 'waiting-confirmation';
            this[this.currentStep.show]();
            return;
        }

        // 説明画面のOKが押されるまでは操作を受け付けない。
        if (this.stepState === 'waiting-confirmation') {
            ball.setInputEnabled(false);
            this[this.currentStep.updateWaiting]?.(ball);
            return;
        }

        ball.setInputEnabled(true);

        // 各手順のupdate関数は、完了したときにtrueを返す。
        const isCompleted = this[this.currentStep.update](ball);
        if (isCompleted) this.advanceStep();
    }

    /** 説明のOKが押された後、現在の練習を開始する。 */
    beginCurrentStep() {
        this.resetEnemyPosition();
        this[this.currentStep.begin]();
        this.stepState = 'practicing';
        this.ball.setInputEnabled(true);
    }

    /** 現在の手順を完了し、次の手順へ進める。 */
    advanceStep() {
        this.ball.setInputEnabled(false);
        this.stepIndex++;
        this.stepState = 'not-started';
    }

    showMovementExplanation() {
        const description = this.isMobile
            ? 'スマートフォンを前後に傾けると、ボールが前進・後進します。端末を前後に傾けて、一定距離を移動してみましょう。'
            : 'W・Sキー、または上下の矢印キーで前進・後進します。一定距離を移動してみましょう。';

        this.ball.reset();

        this.showStepOverlay('前進・後進の練習', description);
    }

    beginMovementPractice() {
        this.traveledDistance = 0;
        this.previousBallPosition = null;
    }

    updateMovementPractice(ball) {
        const position = ball.body.position;

        if (!this.previousBallPosition) {
            this.previousBallPosition = { x: position.x, z: position.z };
            return false;
        }

        const dx = position.x - this.previousBallPosition.x;
        const dz = position.z - this.previousBallPosition.z;
        this.traveledDistance += Math.hypot(dx, dz);
        this.previousBallPosition.x = position.x;
        this.previousBallPosition.z = position.z;

        return this.traveledDistance >= TutorialController.MOVE_DISTANCE;
    }

    showTurnExplanation() {
        const description = this.isMobile
            ? 'スマートフォンを左右に傾けると、ボールの進行方向を変えられます。左右どちらかへ90度以上回転してみましょう。'
            : 'A・Dキー、または左右の矢印キーで進行方向を変えられます。左右どちらかへ90度以上回転してみましょう。';

        this.ball.reset();
        this.showStepOverlay('方向転換の練習', description);
    }

    beginTurnPractice() {
        this.turnedAngle = 0;
        this.previousHeading = this.ball.heading;
    }

    updateTurnPractice(ball) {
        if (this.previousHeading === null) {
            this.previousHeading = ball.heading;
            return false;
        }

        const headingDifference = Math.atan2(
            Math.sin(ball.heading - this.previousHeading),
            Math.cos(ball.heading - this.previousHeading)
        );

        this.turnedAngle += Math.abs(headingDifference);
        this.previousHeading = ball.heading;

        return this.turnedAngle >= TutorialController.TURN_ANGLE;
    }

    showJumpExplanation() {
        const description = this.isMobile
            ? '画面をタップするとジャンプできます。実際に1回ジャンプして、着地してみましょう。'
            : 'スペースキーを押すとジャンプできます。実際に1回ジャンプして、着地してみましょう。';

        this.ball.reset();
        this.showStepOverlay('ジャンプの練習', description);
    }

    beginJumpPractice() {
        this.jumpStartCount = this.ball.jumpCount;
        this.hasLeftGround = false;
    }

    updateJumpPractice(ball) {
        const hasJumped = ball.jumpCount > this.jumpStartCount;
        const groundHeight = ball.initialPosition.y;

        if (hasJumped && ball.body.position.y > groundHeight + 0.3) {
            this.hasLeftGround = true;
        }

        return this.hasLeftGround && ball.canJump;
    }

    showEvadeExplanation() {
        // 回避練習ではHPバーを残し、敵が倒れないよう十分大きなHPにする
        this.enemy.maxHp = TutorialController.EVADE_ENEMY_HP;
        this.enemy.hp = TutorialController.EVADE_ENEMY_HP;
        updateHpBar(100);
        this.showEnemy();

        this.ball.reset();

        this.showStepOverlay(
            '敵から逃げる練習',
            `${this.enemyName}がボールを追いかけてきます。${this.dangerPartName}を避けて10秒間逃げ続けましょう。`
        );
    }

    beginEvadePractice() {
        this.enemy.isBattleFinished = false;
        this.evadeStartedAt = performance.now();
    }

    updateEvadePractice(ball) {
        const now = performance.now();

        // 派生クラス側でCube/Snakeそれぞれのchaseだけを実行する
        this.chaseTarget(ball, now);

        return now - this.evadeStartedAt >= TutorialController.EVADE_DURATION;
    }

    showBattleExplanation() {
        this.showEnemy();
        showHpBar();

        this.ball.reset();
        this.showStepOverlay(
            '攻撃の練習',
            `${this.enemyName}の${this.dangerPartName}に衝突するとゲームオーバーになります。${this.dangerPartName}を避け、${this.safePartName}にボールをぶつけてHPを減らしてみましょう。`
        );
    }

    beginBattlePractice() {
        this.battleDamageReceived = false;
    }

    updateBattlePractice() {
        return this.battleDamageReceived;
    }

    showWeakPointExplanation() {

        this.ball.reset();
        this.showStepOverlay(
            '弱点への攻撃',
            `${this.weakPartName}は相手の弱点です。他の部位よりも大きなダメージを与えられます。${this.weakPartName}を狙って攻撃してみましょう。`
        );
    }

    beginWeakPointPractice() {
        this.weakPointHit = false;
    }

    updateWeakPointPractice() {
        return this.weakPointHit;
    }

    /** 敵側でダメージが発生したときに、現在の攻撃練習の完了を記録する。 */
    notifyDamage(damage, { isWeakPoint = false } = {}) {
        if (this.stepState !== 'practicing' || damage <= 0) return;

        if (this.currentStep?.id === 'battle') {
            this.battleDamageReceived = true;
            this.ball?.setInputEnabled(false);
            return;
        }

        if (this.currentStep?.id === 'weak-point' && isWeakPoint) {
            this.weakPointHit = true;
            this.enemy.isBattleFinished = true;
            this.ball?.setInputEnabled(false);
        }
    }

    /** チュートリアル中に危険部位へ触れた場合の処理。 */
    notifyDangerCollision() {
        if (this.stepState !== 'practicing' || this.dangerNoticeOpen) return;

        // 回避練習では危険部位への衝突をゲームオーバーとしてやり直す
        if (this.currentStep?.id === 'evade') {
            this.notifyEvadeGameOver();
            return;
        }

        this.dangerNoticeOpen = true;
        this.ball?.setInputEnabled(false);

        this.showOverlay(
            '危険な攻撃部位です',
            `${this.dangerPartName}に衝突すると、通常のゲームではゲームオーバーになります。この部位を避けて攻撃しましょう。`,
            '練習を続ける',
            () => {
                this.dangerNoticeOpen = false;
                this.ball?.setInputEnabled(true);
            }
        );
    }

    /** 回避練習中に攻撃部位へ触れた場合、配置と制限時間をリセットする */
    notifyEvadeGameOver() {
        if (
            this.currentStep?.id !== 'evade'
            || this.stepState !== 'practicing'
            || this.dangerNoticeOpen
        ) return;

        this.dangerNoticeOpen = true;
        this.ball?.setInputEnabled(false);

        this.showOverlay(
            'ゲームオーバー',
            `${this.dangerPartName}に衝突しました。ボールと敵を初期位置に戻し、もう一度10秒間の回避に挑戦します。`,
            'やり直す',
            () => {
                this.ball.reset();
                this.resetEnemyPosition();
                this.evadeStartedAt = performance.now();
                this.dangerNoticeOpen = false;
                this.ball.setInputEnabled(true);
            }
        );
    }

    showTutorialCompletion() {
        this.showOverlay(
            'チュートリアル完了',
            `${this.enemyName}とのすべての練習を完了しました！`,
            'モード選択へ戻る',
            () => {
                window.dispatchEvent(new CustomEvent('back-to-mode-select'));
            }
        );
    }

    /** 現在の手順を開始する共通の説明画面 */
    showStepOverlay(title, message) {
        this.showOverlay(title, message, 'OK', () => this.beginCurrentStep());
    }

    showOverlay(title, message, buttonText, onConfirm) {
        this.removeOverlay();

        const overlay = document.createElement('div');
        overlay.className = 'game-tutorial-overlay';

        const modal = document.createElement('div');
        modal.className = 'game-tutorial-modal';

        const heading = document.createElement('h2');
        heading.className = 'game-tutorial-title';
        heading.textContent = title;

        const description = document.createElement('p');
        description.className = 'game-tutorial-description';
        description.textContent = message;

        const button = document.createElement('button');
        button.className = 'game-tutorial-button';
        button.textContent = buttonText;
        button.addEventListener('click', () => {
            this.removeOverlay();
            onConfirm();
        }, { once: true });

        modal.appendChild(heading);
        modal.appendChild(description);
        modal.appendChild(button);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        this.overlay = overlay;
    }

    removeOverlay() {
        this.overlay?.remove();
        this.overlay = null;
    }

    // 派生クラスで実装する
    showEnemy() {}

    // 派生クラスで実装する
    resetEnemyPosition() {}

    // 派生クラスで実装する
    chaseTarget() {}
}
