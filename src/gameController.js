import { destroyRenderer, initRenderer } from './core/renderer.js';
import { destroyPhysics,  initPhysics, world }  from './core/physics.js';
import { Ball } from './object/ball.js';
import { Cube } from './object/cube.js';
import { Snake } from './object/snake.js';
import { Opponent, Difficulty, GameState } from './constants.js';
import { pauseGameClock, resetGameClock, resumeGameClock } from './core/gameClock.js';

let started = false;
let destroyGameFlg = false;

let ball = null;
let cube = null;
let snake = null;

let opponent = null;
let difficulty = null;

let gameState = GameState.IDLE;
let inputEnabledBeforePause = true;

export { started, destroyGameFlg, ball, cube, snake, opponent, difficulty, gameState };

// ゲームオーバー時には started を false に設定(アニメーションの停止)
window.addEventListener('game-over', hundleGameOver);
window.addEventListener('game-clear', handleGameClear);
window.addEventListener('back-to-mode-select', returnToModeSelect);


// ゲームの難易度と敵を更新
export function updateOpponentAndDifficulty(newOpponent, newDifficulty) {
    opponent = newOpponent;
    difficulty = newDifficulty;
}

export function pauseGame() {
    if (!started || gameState !== GameState.PLAYING) return false;

    gameState = GameState.PAUSED;
    inputEnabledBeforePause = ball?.inputEnabled ?? true;
    ball?.setInputEnabled(false);
    pauseGameClock();
    return true;
}

export function resumeGame() {
    if (gameState !== GameState.PAUSED) return false;

    gameState = GameState.PLAYING;
    resumeGameClock();
    ball?.setInputEnabled(inputEnabledBeforePause);
    return true;
}

function hundleGameOver() {
    if (gameState !== GameState.PLAYING) return;

    gameState = GameState.GAME_OVER;
    started = false;
}

function handleGameClear() {
    if (gameState !== GameState.PLAYING) return;

    gameState = GameState.GAME_CLEAR;
    started = false;
}

function restartGame() {
    destroyGame();
    startGame();
}

function returnToModeSelect() {
    destroyGame();
    gameState = GameState.IDLE;
}

// 物理演算器とレンダラを削除 & 各種変数を初期化
export function destroyGame() {
    resetGameClock();
    cube?.tutorial?.removeOverlay();
    snake?.tutorial?.removeOverlay();
    destroyGameFlg = false;
    try{
        destroyRenderer();
    } catch(err){
        console.warn('レンダラー破棄失敗')
    }
    try{
        destroyPhysics();
    } catch(err){
        console.warn('物理エンジン破棄失敗')
    }
    ball = null;
    cube = null;
    snake = null;
}

/// 物理演算器とレンダラを初期化
export function startGame(){
    resetGameClock();
    started = true;
    gameState = GameState.PLAYING;
    initRenderer();
    initPhysics();

    console.log(`Starting game with difficulty: ${difficulty}, opponent: ${opponent}`);

    ball = new Ball();

    // チュートリアルの説明中は、OKが押されるまで操作を受け付けない
    if (Number(difficulty) === Difficulty.TUTORIAL) {
        ball.setInputEnabled(false);
    }

    switch(Number(opponent)){
        
        case Opponent.CUBE:
            cube = new Cube(difficulty);
            break;
        case Opponent.SNAKE:
            snake = new Snake(difficulty);
            break;
    }
}

function judgeCanJump(world){
    const normal = new CANNON.Vec3();
    for(const c of world.contacts){
        if (c.bi !== this.body && c.bj !== this.body)
        continue;
        const opponent = (c.bi === this.body) ? c.bj : c.bi;
        if (c.bi === this.body)
            c.ni.negate(normal);
        else
            normal.copy(c.ni);
        if (normal.y < 0.5)
            continue;
        return true;
    }
    return false;
}


export function updateGameState(dt) {
    if (!started || gameState !== GameState.PLAYING) return;

    // ジャンプ可能判定
    ball.canJump = judgeCanJump.call(ball, world);
    ball.update(dt);

    switch(Number(opponent)){
        case Opponent.CUBE:
            if(cube) cube.update(ball);
            break;
        case Opponent.SNAKE:
            if(snake) snake.update(ball);
            break;
    }

    world.step(1 / 60, dt, 3);

}
