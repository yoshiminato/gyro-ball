import { showHpBar, updateHpBar } from '../ui/hpBar.js';
import { isMobileDevice } from '../util.js';
import { getGameTime } from '../core/gameClock.js';

/**
 * CubeとSnakeで共通するチュートリアルの進行を管理する。
 * 敵の物理ボディを表示する方法だけ、各派生クラス側で実装する。
 */
export class TutorialController {

    static MOVE_DISTANCE = 10;
    static TURN_ANGLE = Math.PI / 2;
    static EVADE_DURATION = 10000;
    static EVADE_ENEMY_HP = 200;
    static STEP_COMPLETE_DISPLAY_DURATION = 900;

    /**
     * チュートリアルの実行順。
     * show: その手順の説明表示
     * begin: OKが押されたときの初期化
     * update: 毎フレーム行う完了判定
     */
    steps = [
        {
            id: 'movement',
            show: 'showMovementExplanation',
            begin: 'beginMovementPractice',
            update: 'updateMovementPractice'
        },
        {
            id: 'turn',
            show: 'showTurnExplanation',
            begin: 'beginTurnPractice',
            update: 'updateTurnPractice'
        },
        {
            id: 'jump',
            show: 'showJumpExplanation',
            begin: 'beginJumpPractice',
            update: 'updateJumpPractice'
        },
        {
            id: 'battle',
            show: 'showBattleExplanation',
            begin: 'beginBattlePractice',
            update: 'updateBattlePractice'
        },
        {
            id: 'weak-point',
            show: 'showWeakPointExplanation',
            begin: 'beginWeakPointPractice',
            update: 'updateWeakPointPractice'
        },
        {
            id: 'evade',
            show: 'showEvadeExplanation',
            begin: 'beginEvadePractice',
            update: 'updateEvadePractice'
        }
    ];

    constructor(enemy, enemyName, partNames = {}) {
        this.enemy = enemy;
        this.enemyName = enemyName;
        this.dangerPartName = partNames.danger ?? '赤い攻撃部位';
        this.safePartName = partNames.safe ?? '攻撃部位以外の体';
        this.weakPartName = partNames.weak ?? '黄色い弱点';
        this.ball = null;
        this.overlay = null;
        this.objectivePanel = null;
        this.objectiveTitle = null;
        this.objectiveDescription = null;
        this.objectiveProgressText = null;
        this.objectiveProgressFill = null;
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
        this.stepCompletedAt = 0;
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

        // 達成内容を短時間表示してから、次の説明へ進む。
        if (this.stepState === 'completing') {
            ball.setInputEnabled(false);
            if (
                getGameTime() - this.stepCompletedAt
                >= TutorialController.STEP_COMPLETE_DISPLAY_DURATION
            ) {
                this.advanceStep();
            }
            return;
        }

        // 最後の手順まで終わったら完了画面を表示する。
        if (!this.currentStep) {
            ball.setInputEnabled(false);
            this.hideObjective();

            if (this.stepState !== 'completed') {
                this.stepState = 'completed';
                this.showTutorialCompletion();
            }
            return;
        }

        // 新しい手順に入った最初のフレームで説明を表示する。
        if (this.stepState === 'not-started') {
            ball.setInputEnabled(false);
            this.hideObjective();
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
        this.updateObjective();

        // 各手順のupdate関数は、完了したときにtrueを返す。
        const isCompleted = this[this.currentStep.update](ball);
        if (isCompleted) {
            this.completeCurrentStep();
        } else {
            this.updateObjective();
        }
    }

    /** 説明のOKが押された後、現在の練習を開始する。 */
    beginCurrentStep() {
        this.resetEnemyPosition();
        this[this.currentStep.begin]();
        this.stepState = 'practicing';
        this.ball.setInputEnabled(true);
        this.updateObjective();
    }

    /** 達成した手順を短時間表示する。 */
    completeCurrentStep() {
        const completedStepId = this.currentStep.id;
        this.stepState = 'completing';
        this.stepCompletedAt = getGameTime();
        this.ball.setInputEnabled(false);
        this.showObjective(
            `✓ ${this.getStepTitle(completedStepId)} 完了！`,
            '次の練習へ進みます',
            '達成',
            1
        );
    }

    /** 現在の手順を完了し、次の手順へ進める。 */
    advanceStep() {
        this.ball.setInputEnabled(false);
        this.stepIndex++;
        this.stepState = 'not-started';
    }

    /** 現在の練習内容と進捗を画面上部へ表示する。 */
    updateObjective() {
        const stepId = this.currentStep?.id;
        if (!stepId || this.stepState !== 'practicing') return;

        const now = getGameTime();

        switch (stepId) {
            case 'movement': {
                const progress = Math.min(
                    this.traveledDistance / TutorialController.MOVE_DISTANCE,
                    1
                );
                this.showObjective(
                    '前進・後進の練習',
                    this.isMobile
                        ? '端末を前後に傾けて10m移動しよう'
                        : 'W・Sキーで10m移動しよう',
                    `${this.traveledDistance.toFixed(1)} / ${TutorialController.MOVE_DISTANCE}m`,
                    progress
                );
                break;
            }
            case 'turn': {
                const targetDegrees = Math.round(
                    TutorialController.TURN_ANGLE * 180 / Math.PI
                );
                const currentDegrees = Math.min(
                    this.turnedAngle * 180 / Math.PI,
                    targetDegrees
                );
                this.showObjective(
                    '方向転換の練習',
                    this.isMobile
                        ? '端末を左右に傾けて90°回転しよう'
                        : 'A・Dキーで90°回転しよう',
                    `${Math.round(currentDegrees)} / ${targetDegrees}°`,
                    currentDegrees / targetDegrees
                );
                break;
            }
            case 'jump': {
                const hasJumped = this.ball.jumpCount > this.jumpStartCount;
                this.showObjective(
                    'ジャンプの練習',
                    this.isMobile
                        ? '画面をタップしてジャンプし、着地しよう'
                        : 'Spaceキーでジャンプし、着地しよう',
                    this.hasLeftGround
                        ? '着地しよう'
                        : (hasJumped ? 'ジャンプ中' : 'ジャンプしよう'),
                    this.hasLeftGround ? 0.75 : (hasJumped ? 0.5 : 0)
                );
                break;
            }
            case 'battle':
                this.showObjective(
                    '攻撃の練習',
                    `${this.dangerPartName}を避け、${this.safePartName}にぶつかろう`,
                    '1回ダメージを与える',
                    this.battleDamageReceived ? 1 : 0
                );
                break;
            case 'weak-point':
                this.showObjective(
                    '弱点への攻撃',
                    `${this.weakPartName}にボールをぶつけよう`,
                    '弱点を1回攻撃する',
                    this.weakPointHit ? 1 : 0
                );
                break;
            case 'evade': {
                const elapsed = Math.max(0, now - this.evadeStartedAt);
                const remaining = Math.max(
                    0,
                    TutorialController.EVADE_DURATION - elapsed
                );
                this.showObjective(
                    '敵から逃げる練習',
                    `${this.dangerPartName}を避けて逃げ続けよう`,
                    `残り ${(remaining / 1000).toFixed(1)}秒`,
                    elapsed / TutorialController.EVADE_DURATION
                );
                break;
            }
            case 'warningState': {
                const duration = this.warningStateDuration ?? 2000;
                const elapsed = Math.max(0, now - (this.warningStartedAt ?? now));
                this.showObjective(
                    'レーザーの予兆',
                    `${this.enemyName}の点滅を確認しよう`,
                    '点滅状態の確認',
                    elapsed / duration
                );
                break;
            }
            case 'lightRay': {
                const isFiring = this.enemy.isFiringLightRay;
                const warningDuration = this.warningStateDuration ?? 2000;
                const warningElapsed = Math.max(
                    0,
                    now - (this.warningStateStartTime ?? now)
                );
                this.showObjective(
                    'レーザー回避',
                    isFiring
                        ? '移動してレーザーの射線から離れよう'
                        : '点滅を確認して発射に備えよう',
                    isFiring ? 'レーザー発射中' : '発射準備中',
                    isFiring ? 0.75 : warningElapsed / warningDuration
                );
                break;
            }
        }
    }

    /**
     * 手順IDから進捗パネル用の表示名を取得する。
     * @param {string} stepId - 手順ID
     * @returns {string} 表示名
     */
    getStepTitle(stepId) {
        return {
            movement: '前進・後進の練習',
            turn: '方向転換の練習',
            jump: 'ジャンプの練習',
            battle: '攻撃の練習',
            'weak-point': '弱点への攻撃',
            evade: '敵から逃げる練習',
            warningState: 'レーザーの予兆',
            lightRay: 'レーザー回避'
        }[stepId] ?? '練習';
    }

    /**
     * 現在の目標と0～1の進捗を共通パネルへ表示する。
     * @param {string} title - 目標名
     * @param {string} description - 操作説明
     * @param {string} progressText - 進捗テキスト
     * @param {number} progress - 0～1の達成率
     */
    showObjective(title, description, progressText, progress) {
        this.ensureObjectivePanel();
        this.objectiveTitle.textContent = title;
        this.objectiveDescription.textContent = description;
        this.objectiveProgressText.textContent = progressText;
        this.objectiveProgressFill.style.width =
            `${Math.max(0, Math.min(progress, 1)) * 100}%`;
        this.objectivePanel.hidden = false;
    }

    /** 進捗パネルを初回表示時に生成し、各要素を保持する。 */
    ensureObjectivePanel() {
        if (this.objectivePanel) return;

        const panel = document.createElement('aside');
        panel.className = 'tutorial-objective-panel';
        panel.setAttribute('aria-label', '現在の目標');

        const title = document.createElement('strong');
        title.className = 'tutorial-objective-title';

        const description = document.createElement('p');
        description.className = 'tutorial-objective-description';

        const progressRow = document.createElement('div');
        progressRow.className = 'tutorial-objective-progress-row';

        const progressTrack = document.createElement('div');
        progressTrack.className = 'tutorial-objective-progress-track';

        const progressFill = document.createElement('div');
        progressFill.className = 'tutorial-objective-progress-fill';

        const progressText = document.createElement('span');
        progressText.className = 'tutorial-objective-progress-text';

        progressTrack.appendChild(progressFill);
        progressRow.appendChild(progressTrack);
        progressRow.appendChild(progressText);
        panel.appendChild(title);
        panel.appendChild(description);
        panel.appendChild(progressRow);
        document.body.appendChild(panel);

        this.objectivePanel = panel;
        this.objectiveTitle = title;
        this.objectiveDescription = description;
        this.objectiveProgressText = progressText;
        this.objectiveProgressFill = progressFill;
    }

    /** 説明モーダル表示中など、進捗パネルが不要な間は隠す。 */
    hideObjective() {
        if (this.objectivePanel) this.objectivePanel.hidden = true;
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
        this.evadeStartedAt = getGameTime();
    }

    updateEvadePractice(ball) {
        const now = getGameTime();

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
                this.ball.reset();
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
                this.evadeStartedAt = getGameTime();
                this.dangerNoticeOpen = false;
                this.ball.setInputEnabled(true);
            }
        );
    }

    /** 全手順の完了を通知し、モード選択へ戻る導線を表示する。 */
    showTutorialCompletion() {
        this.hideObjective();
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
        this.showOverlay(
            title,
            message,
            '練習を開始',
            () => this.beginCurrentStep()
        );
    }

    /**
     * チュートリアル共通モーダルを生成する。
     * @param {string} title - 見出し
     * @param {string} message - 説明文
     * @param {string} buttonText - 確認ボタンの文言
     * @param {Function} onConfirm - 確認後の処理
     */
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

    /** 現在の説明モーダルを削除する。 */
    removeOverlay() {
        this.overlay?.remove();
        this.overlay = null;
    }

    /** ゲーム離脱時にチュートリアルが生成したDOMをすべて破棄する。 */
    destroyUi() {
        this.removeOverlay();
        this.objectivePanel?.remove();
        this.objectivePanel = null;
        this.objectiveTitle = null;
        this.objectiveDescription = null;
        this.objectiveProgressText = null;
        this.objectiveProgressFill = null;
    }

    /** 敵種別ごとの物理ボディとメッシュ表示処理。派生クラスで実装する。 */
    showEnemy() {}

    /** 敵種別ごとの初期位置復元処理。派生クラスで実装する。 */
    resetEnemyPosition() {}

    /** 敵種別ごとの追跡処理。派生クラスで実装する。 */
    chaseTarget() {}
}
