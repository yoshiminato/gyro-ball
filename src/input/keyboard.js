import { Ball } from '../object/ball.js';

// 押下中のキー状態。keydownのリピート回数には依存しない。
const keys = {};
let currentBall = null;
let registered = false;

const FORCE_COEF = 1.0;

/**
 * 操作対象を更新し、キーボードイベントを初回だけ登録する。
 * @param {Ball} ball - 現在操作するボール
 * @returns {void}
 */
export function registerKeyEvent(ball) {
    currentBall = ball;
    clearKeyState();
    if (registered) return;

    registered = true;
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', clearKeyState);
    window.addEventListener('pagehide', clearKeyState);
    window.addEventListener('game-over', clearKeyState);
    window.addEventListener('game-clear', clearKeyState);
    window.addEventListener('back-to-mode-select', clearKeyState);
}

function handleKeyDown(e) {
    keys[e.code] = true;
    if (e.code === 'Space') currentBall?.triggerJump();
    // if (e.code === 'KeyR') currentBall?.resetPosition();
}

function handleKeyUp(e) {
    keys[e.code] = false;
}

function handleVisibilityChange() {
    if (document.hidden) clearKeyState();
}

/** フォーカス喪失時に押下状態が残らないよう全キーを解除する。 */
function clearKeyState() {
    Object.keys(keys).forEach((code) => {
        keys[code] = false;
    });
}

/**
 * 左右入力から1フレーム分の旋回角を求める。
 * @param {number} dt - 前フレームからの経過秒数
 * @returns {number} 旋回角
 */
function calculateHeadingDeltaFromKeys(dt) {
    if (keys['ArrowLeft'] || keys['KeyA']) return -Ball.HEADING_SCALE * dt;
    if (keys['ArrowRight'] || keys['KeyD']) return Ball.HEADING_SCALE * dt;
    return 0;
}

/**
 * 前後移動と旋回入力から水平面の推進力を求める。
 * @param {Ball} ball - 操作対象
 * @param {number} dt - 前フレームからの経過秒数
 * @returns {CANNON.Vec3} ボールへ加える力
 */
export function calculateForceFromKeys(ball, dt) {
    let forwardForce = 0;
    ball.heading += calculateHeadingDeltaFromKeys(dt);
    if (keys['ArrowUp'] || keys['KeyW'])   forwardForce =  Ball.FORCE_SCALE;
    if (keys['ArrowDown'] || keys['KeyS']) forwardForce = -Ball.FORCE_SCALE;
    const fx = Math.sin(ball.heading) * forwardForce * FORCE_COEF;
    const fz = -Math.cos(ball.heading) * forwardForce * FORCE_COEF;
    return new CANNON.Vec3(fx, 0, fz);
}
