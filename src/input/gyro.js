import { isMobileDevice } from '../util.js';
import { Ball } from '../object/ball.js';

// 端末から取得した現在角度と、操作開始時の基準角度。
export let gyroBeta = 0;
export let gyroGamma = 0;

export let gyroBetaZero = 0;
export let gyroGammaZero = 0;

export let gyroEnabled = false;
export let gyroCalibrated = false;

let lastGamma = Infinity;
let lastBeta = Infinity;
let resolveCalibration = null;

// 前後方向は25度の傾きでキーボード操作と同じ最大推進力に達する。
const MAX_FORWARD_TILT = 25;

/**
 * 必要な端末ではセンサー利用許可を要求し、基準角度の確定まで待機する。
 * @returns {Promise<boolean>} ジャイロを有効化できた場合はtrue
 */
export async function requestGyro() {
    if (gyroEnabled) return true;

    window.removeEventListener('deviceorientation', saveZeroPoint, true);

    if (
        typeof DeviceOrientationEvent === 'undefined'
        || !isMobileDevice()
    ) {
        return false;
    }

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission !== 'granted') return false;
        } catch (error) {
            console.warn('ジャイロセンサーの利用許可を取得できませんでした', error);
            return false;
        }
    }

    return new Promise((resolve) => {
        resolveCalibration = resolve;
        enableGyro();
    });
}

/**
 * 基準角度を決めるための端末姿勢イベントを登録する。
 * @returns {void}
 */
function enableGyro() {
    window.addEventListener('deviceorientation', saveZeroPoint, true);
}

/**
 * 最新角度を保存し、端末が安定した時点を操作のゼロ点にする。
 * @param {DeviceOrientationEvent} e - 端末姿勢イベント
 * @returns {void}
 */
function saveZeroPoint(e) {
    if (e.beta === null || e.gamma === null) return;

    gyroBeta = e.beta || 0;
    gyroGamma = e.gamma || 0;
    if (gyroCalibrated) return;

    const dBeta = Math.abs(e.beta - lastBeta);
    const dGamma = Math.abs(e.gamma - lastGamma);
    lastBeta = e.beta;
    lastGamma = e.gamma;

    // ジャイロの値が安定するまで待つ(ユーザは端末を制止させている前提)
    if((dBeta > 0.5 || dGamma > 0.5)){
        return;
    };

    gyroBetaZero = e.beta || 0;
    gyroGammaZero = e.gamma || 0;
    gyroCalibrated = true;    
    gyroEnabled = true;
    resolveCalibration?.(true);
    resolveCalibration = null;
}

/** 新しくゲームを始める前にジャイロの基準点と有効状態を初期化する。 */
export function resetCalibration() {
    resolveCalibration?.(false);
    resolveCalibration = null;
    gyroEnabled = false;
    gyroCalibrated = false;
    lastBeta = Infinity;
    lastGamma = Infinity;
}

/**
 * beta軸の傾きから1フレーム分の旋回角を求める。
 * @param {number} dt - 前フレームからの経過秒数
 * @returns {number} 旋回角
 */
function calculateHeadingDeltaFromGyro(dt){
    const beta2zero = Math.max(-45, Math.min(45, gyroBeta  - gyroBetaZero));
    return (beta2zero / 45) * Ball.HEADING_SCALE * dt;
}

/**
 * beta軸を旋回、gamma軸を前後移動として推進力を求める。
 * @param {Ball} ball - 操作対象
 * @param {number} dt - 前フレームからの経過秒数
 * @returns {CANNON.Vec3} ボールへ加える力
 */
export function calculateForceFromGyro(ball, dt){
    const headingDelta = calculateHeadingDeltaFromGyro(dt);
    ball.heading += headingDelta;
    const heading = ball.heading;
    const gamma2zero = Math.max(
        -MAX_FORWARD_TILT,
        Math.min(MAX_FORWARD_TILT, gyroGamma - gyroGammaZero)
    );
    const forwardForce =
        (gamma2zero / MAX_FORWARD_TILT) * Ball.FORCE_SCALE;
    const fx = Math.sin(heading) * forwardForce;
    const fz = -Math.cos(heading) * forwardForce;
    return new CANNON.Vec3(fx, 0, fz);
}
