import { isMobileDevice } from '../util.js';
import { Ball } from '../object/ball.js';

// 端末から取得した現在角度と、操作開始時の基準角度。
export let gyroBeta = 0;
export let gyroGamma = 0;
export let gyroBetaZero = 0;
export let gyroGammaZero = 0;
export let gyroEnabled = false;
export let gyroCalibrated = false;

export const GyroFailureReason = Object.freeze({
    UNSUPPORTED: 'unsupported',
    PERMISSION_DENIED: 'permission-denied',
    PERMISSION_ERROR: 'permission-error',
    SENSOR_UNAVAILABLE: 'sensor-unavailable',
    CALIBRATION_TIMEOUT: 'calibration-timeout',
    CANCELLED: 'cancelled'
});

const CALIBRATION_TIMEOUT_MS = 5000;
const CALIBRATION_SAMPLE_COUNT = 8;
const STABLE_ANGLE_DELTA = 0.8;
const TURN_DEAD_ZONE = 1.5;
const FORWARD_DEAD_ZONE = 1.5;
const MAX_TURN_TILT = 45;
const MAX_FORWARD_TILT = 25;

let lastBeta = null;
let lastGamma = null;
let calibrationSamples = [];
let validReadingCount = 0;
let calibrationScreenAngle = 0;
let calibrationTimeoutId = null;
let resolveCalibration = null;
let calibrationRequestId = 0;
let orientationListenerRegistered = false;

function result(ok, reason = null) {
    return { ok, reason };
}

function getScreenAngle() {
    const modernAngle = Number(screen.orientation?.angle);
    const legacyAngle = Number(window.orientation);
    const rawAngle = Number.isFinite(modernAngle)
        ? modernAngle
        : (Number.isFinite(legacyAngle) ? legacyAngle : 0);
    const normalized = ((rawAngle % 360) + 360) % 360;
    return (Math.round(normalized / 90) * 90) % 360;
}

function angularDifference(current, previous) {
    return Math.atan2(
        Math.sin((current - previous) * Math.PI / 180),
        Math.cos((current - previous) * Math.PI / 180)
    ) * 180 / Math.PI;
}

function resetSampleCollection() {
    gyroEnabled = false;
    gyroCalibrated = false;
    lastBeta = null;
    lastGamma = null;
    calibrationSamples = [];
    validReadingCount = 0;
    calibrationScreenAngle = getScreenAngle();
}

function clearCalibrationTimeout() {
    if (calibrationTimeoutId === null) return;
    clearTimeout(calibrationTimeoutId);
    calibrationTimeoutId = null;
}

function startCalibrationTimeout(requestId) {
    clearCalibrationTimeout();
    calibrationTimeoutId = setTimeout(() => {
        if (requestId !== calibrationRequestId) return;
        failCalibration(
            validReadingCount === 0
                ? GyroFailureReason.SENSOR_UNAVAILABLE
                : GyroFailureReason.CALIBRATION_TIMEOUT
        );
    }, CALIBRATION_TIMEOUT_MS);
}

function removeSensorListeners() {
    window.removeEventListener('deviceorientation', saveZeroPoint, true);
    if (!orientationListenerRegistered) return;
    screen.orientation?.removeEventListener?.('change', handleOrientationChange);
    window.removeEventListener('orientationchange', handleOrientationChange);
    orientationListenerRegistered = false;
}

function enableSensorListeners() {
    window.addEventListener('deviceorientation', saveZeroPoint, true);
    if (orientationListenerRegistered) return;
    screen.orientation?.addEventListener?.('change', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    orientationListenerRegistered = true;
}

function settleCalibration(calibrationResult) {
    clearCalibrationTimeout();
    const resolve = resolveCalibration;
    resolveCalibration = null;
    resolve?.(calibrationResult);
}

function failCalibration(reason) {
    gyroEnabled = false;
    gyroCalibrated = false;
    removeSensorListeners();
    settleCalibration(result(false, reason));
}

function completeCalibration() {
    const sampleCount = calibrationSamples.length;
    gyroBetaZero = calibrationSamples.reduce(
        (sum, sample) => sum + sample.beta,
        0
    ) / sampleCount;
    gyroGammaZero = calibrationSamples.reduce(
        (sum, sample) => sum + sample.gamma,
        0
    ) / sampleCount;
    gyroCalibrated = true;
    gyroEnabled = true;
    settleCalibration(result(true));
}

/**
 * 必要な端末ではセンサー利用許可を要求し、基準角度の確定まで待機する。
 * @returns {Promise<{ok: boolean, reason: string|null}>} 調整結果
 */
export async function requestGyro() {
    if (gyroEnabled) return result(true);

    removeSensorListeners();
    clearCalibrationTimeout();
    resetSampleCollection();
    const requestId = ++calibrationRequestId;

    if (
        typeof DeviceOrientationEvent === 'undefined'
        || !isMobileDevice()
    ) {
        return result(false, GyroFailureReason.UNSUPPORTED);
    }

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (requestId !== calibrationRequestId) {
                return result(false, GyroFailureReason.CANCELLED);
            }
            if (permission !== 'granted') {
                return result(false, GyroFailureReason.PERMISSION_DENIED);
            }
        } catch (error) {
            console.warn('ジャイロセンサーの利用許可を取得できませんでした', error);
            return result(false, GyroFailureReason.PERMISSION_ERROR);
        }
    }

    return new Promise((resolve) => {
        resolveCalibration = resolve;
        enableSensorListeners();
        startCalibrationTimeout(requestId);
    });
}

/** 最新角度を保存し、安定した複数サンプルの平均をゼロ点にする。 */
function saveZeroPoint(event) {
    if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;

    gyroBeta = event.beta;
    gyroGamma = event.gamma;

    if (getScreenAngle() !== calibrationScreenAngle) {
        resetSampleCollection();
        if (resolveCalibration) {
            startCalibrationTimeout(calibrationRequestId);
        }
    }
    if (gyroCalibrated) return;

    validReadingCount++;
    const sample = { beta: event.beta, gamma: event.gamma };

    if (lastBeta === null || lastGamma === null) {
        calibrationSamples = [sample];
    } else {
        const betaDelta = Math.abs(angularDifference(event.beta, lastBeta));
        const gammaDelta = Math.abs(angularDifference(event.gamma, lastGamma));
        if (
            betaDelta <= STABLE_ANGLE_DELTA
            && gammaDelta <= STABLE_ANGLE_DELTA
        ) {
            calibrationSamples.push(sample);
        } else {
            calibrationSamples = [sample];
        }
    }

    lastBeta = event.beta;
    lastGamma = event.gamma;

    if (calibrationSamples.length >= CALIBRATION_SAMPLE_COUNT) {
        completeCalibration();
    }
}

/** 画面が回転した場合は、新しい向きで自動的にゼロ点を取り直す。 */
function handleOrientationChange() {
    if (getScreenAngle() === calibrationScreenAngle) return;
    resetSampleCollection();
    if (resolveCalibration) {
        startCalibrationTimeout(calibrationRequestId);
    }
}

/** 新しくゲームを始める前にジャイロの基準点と有効状態を初期化する。 */
export function resetCalibration() {
    calibrationRequestId++;
    removeSensorListeners();
    clearCalibrationTimeout();
    const resolve = resolveCalibration;
    resolveCalibration = null;
    resolve?.(result(false, GyroFailureReason.CANCELLED));
    gyroBeta = 0;
    gyroGamma = 0;
    gyroBetaZero = 0;
    gyroGammaZero = 0;
    resetSampleCollection();
}

function mapTiltToScreen(betaDelta, gammaDelta, screenAngle) {
    switch (screenAngle) {
        case 90:
            return { turn: betaDelta, forward: gammaDelta };
        case 180:
            return { turn: -gammaDelta, forward: -betaDelta };
        case 270:
            return { turn: -betaDelta, forward: -gammaDelta };
        default:
            return { turn: gammaDelta, forward: betaDelta };
    }
}

function applyDeadZone(value, deadZone) {
    const magnitude = Math.abs(value);
    if (magnitude <= deadZone) return 0;
    return Math.sign(value) * (magnitude - deadZone);
}

function getCurrentTilt() {
    const betaDelta = angularDifference(gyroBeta, gyroBetaZero);
    const gammaDelta = angularDifference(gyroGamma, gyroGammaZero);
    const tilt = mapTiltToScreen(
        betaDelta,
        gammaDelta,
        calibrationScreenAngle
    );
    return {
        turn: applyDeadZone(tilt.turn, TURN_DEAD_ZONE),
        forward: applyDeadZone(tilt.forward, FORWARD_DEAD_ZONE)
    };
}

function calculateHeadingDeltaFromGyro(dt, turnTilt) {
    const clampedTilt = Math.max(
        -MAX_TURN_TILT,
        Math.min(MAX_TURN_TILT, turnTilt)
    );
    return (clampedTilt / MAX_TURN_TILT) * Ball.HEADING_SCALE * dt;
}

/** 画面方向へ正規化した傾きから、旋回と前後方向の推進力を求める。 */
export function calculateForceFromGyro(ball, dt) {
    if (!gyroEnabled || !gyroCalibrated) {
        return new CANNON.Vec3(0, 0, 0);
    }

    const tilt = getCurrentTilt();
    ball.heading += calculateHeadingDeltaFromGyro(dt, tilt.turn);

    const forwardTilt = Math.max(
        -MAX_FORWARD_TILT,
        Math.min(MAX_FORWARD_TILT, tilt.forward)
    );
    const forwardForce =
        (forwardTilt / MAX_FORWARD_TILT) * Ball.FORCE_SCALE;
    const fx = Math.sin(ball.heading) * forwardForce;
    const fz = -Math.cos(ball.heading) * forwardForce;
    return new CANNON.Vec3(fx, 0, fz);
}
