import { destroyRenderer, initRenderer } from './core/renderer.js';
import { destroyPhysics,  initPhysics, world }  from './core/physics.js';
import { Ball } from './object/ball.js';
import { Cube } from './object/cube.js';
import { Snake } from './object/snake.js';
import {
    Opponent,
    Difficulty,
    DifficultyNames,
    GameState
} from './constants.js';
import { pauseGameClock, resetGameClock, resumeGameClock } from './core/gameClock.js';
import { resetHitEffects } from './core/hitEffects.js';
import {
    pauseBgm,
    playGameClearBgm,
    playGameBgm,
    playGameOverBgm,
    resumeBgm,
    stopBgm
} from './audioManager.js';

let started = false;
let ball = null;
let cube = null;
let snake = null;

let opponent = null;
let difficulty = null;

let gameState = GameState.IDLE;
let inputEnabledBeforePause = true;

export { started, ball, cube, snake, opponent, difficulty, gameState };

// 勝敗・画面離脱イベントとゲーム内部状態を同期する。
window.addEventListener('game-over', handleGameOver);
window.addEventListener('game-clear', handleGameClear);
window.addEventListener('back-to-mode-select', returnToModeSelect);


/**
 * モード選択画面で選ばれた敵と難易度を保持する。
 * @param {number} newOpponent - Opponentの値
 * @param {number} newDifficulty - Difficultyの値
 * @returns {void}
 */
export function updateOpponentAndDifficulty(newOpponent, newDifficulty) {
    opponent = newOpponent;
    difficulty = newDifficulty;
}

/**
 * 進行中のゲームを停止し、入力・時計・BGMを一時停止する。
 * @returns {boolean} ポーズ状態へ移行できた場合はtrue
 */
export function pauseGame() {
    if (!started || gameState !== GameState.PLAYING) return false;

    gameState = GameState.PAUSED;
    inputEnabledBeforePause = ball?.inputEnabled ?? true;
    ball?.setInputEnabled(false);
    pauseGameClock();
    pauseBgm();
    return true;
}

/**
 * ポーズ前の入力状態を復元し、ゲームを再開する。
 * @returns {boolean} 再開できた場合はtrue
 */
export function resumeGame() {
    if (gameState !== GameState.PAUSED) return false;

    gameState = GameState.PLAYING;
    resumeGameClock();
    ball?.setInputEnabled(inputEnabledBeforePause);
    resumeBgm();
    return true;
}

function handleGameOver() {
    if (gameState !== GameState.PLAYING) return;

    gameState = GameState.GAME_OVER;
    started = false;
    playGameOverBgm();
}

function handleGameClear() {
    if (gameState !== GameState.PLAYING) return;

    gameState = GameState.GAME_CLEAR;
    started = false;
    playGameClearBgm();
}

function returnToModeSelect() {
    destroyGame();
}

function runCleanup(label, cleanup) {
    try {
        cleanup();
    } catch (error) {
        console.warn(`${label}の破棄に失敗しました`, error);
    }
}

function cleanupGameResources(cubeToDestroy = cube, snakeToDestroy = snake) {
    runCleanup('CubeチュートリアルUI', () => {
        cubeToDestroy?.tutorial?.destroyUi();
    });
    runCleanup('SnakeチュートリアルUI', () => {
        snakeToDestroy?.tutorial?.destroyUi();
    });
    runCleanup('ヒットエフェクト', resetHitEffects);
    runCleanup('レンダラー', destroyRenderer);
    runCleanup('物理エンジン', destroyPhysics);
}

/**
 * 現在のゲームに属するUI・描画・物理オブジェクトを破棄する。
 * 未初期化状態から呼ばれても安全に終了できる。
 * @returns {void}
 */
export function destroyGame() {
    started = false;
    gameState = GameState.IDLE;
    stopBgm();
    resetGameClock();
    cleanupGameResources();
    ball = null;
    cube = null;
    snake = null;
}

/**
 * 選択済みのモードに合わせて描画・物理・プレイヤー・敵を生成する。
 * @returns {void}
 */
export function startGame() {
    const selectedOpponent = Number(opponent);
    const selectedDifficulty = Number(difficulty);

    if (!Object.prototype.hasOwnProperty.call(DifficultyNames, selectedDifficulty)) {
        throw new Error(`未対応の難易度です: ${difficulty}`);
    }
    if (
        selectedOpponent !== Opponent.CUBE
        && selectedOpponent !== Opponent.SNAKE
    ) {
        throw new Error(`未対応の対戦相手です: ${opponent}`);
    }

    let nextBall = null;
    let nextCube = null;
    let nextSnake = null;

    // 初期化がすべて完了するまで公開中のゲーム状態を開始扱いにしない。
    started = false;
    gameState = GameState.IDLE;
    resetGameClock();

    try {
        initRenderer();
        initPhysics();

        nextBall = new Ball();
        if (selectedDifficulty === Difficulty.TUTORIAL) {
            nextBall.setInputEnabled(false);
        }

        if (selectedOpponent === Opponent.CUBE) {
            nextCube = new Cube(selectedDifficulty);
        } else {
            nextSnake = new Snake(selectedDifficulty);
        }

        ball = nextBall;
        cube = nextCube;
        snake = nextSnake;
        playGameBgm(selectedDifficulty === Difficulty.TUTORIAL);

        gameState = GameState.PLAYING;
        started = true;
    } catch (error) {
        cleanupGameResources(nextCube, nextSnake);
        stopBgm();
        resetGameClock();
        ball = null;
        cube = null;
        snake = null;
        started = false;
        gameState = GameState.IDLE;
        throw error;
    }
}

/**
 * ボール下側に十分上向きの接触面があるかを調べる。
 * 壁への横接触ではジャンプ可能にしない。
 * @param {CANNON.World} physicsWorld - 判定対象の物理ワールド
 * @returns {boolean} 接地している場合はtrue
 */
function judgeCanJump(physicsWorld) {
    const normal = new CANNON.Vec3();
    for (const c of physicsWorld.contacts) {
        if (c.bi !== ball.body && c.bj !== ball.body) continue;

        if (c.bi === ball.body) {
            c.ni.negate(normal);
        } else {
            normal.copy(c.ni);
        }

        if (normal.y < 0.5) continue;
        return true;
    }
    return false;
}


/**
 * 1フレーム分のプレイヤー・敵・物理演算を進める。
 * @param {number} dt - 前フレームからの経過秒数
 * @returns {void}
 */
export function updateGameState(dt) {
    if (
        !started
        || gameState !== GameState.PLAYING
        || !world
        || !ball?.body
        || !ball?.mesh
    ) return;

    // ジャンプ可能判定
    ball.canJump = judgeCanJump(world);
    ball.update(dt);

    switch (Number(opponent)) {
        case Opponent.CUBE:
            if(cube) cube.update(ball);
            break;
        case Opponent.SNAKE:
            if(snake) snake.update(ball);
            break;
    }

    world.step(1 / 60, dt, 3);
}
