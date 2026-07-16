import { isMobileDevice } from '../util.js';
import { Ball } from '../object/ball.js';

export let gyroBeta = 0;
export let gyroGamma = 0;

export let gyroBetaZero = 0;
export let gyroGammaZero = 0;

export let gyroEnabled = false;
export let gyroCalibrated = false;

let lastGamma = Infinity;
let lastBeta = Infinity;

export function requestGyro() {
    try{
        window.removeEventListener('deviceorientation', saveZeroPoint, true);
    } catch (error) {
        console.error("Error occurred while removing event listener:", error);
    }
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(perm => {
                if (perm === 'granted') {
                    enableGyro();
                }
            }).catch(console.error);
    } else if (isMobileDevice()) {
        enableGyro();
    }
}

// ジャイロ有効化
function enableGyro() {
    // window.addEventListener('deviceorientation', saveZeroPoint, true);
    window.addEventListener('deviceorientation', saveZeroPoint, true);

}

// ゼロ点記録
function saveZeroPoint(e) {
    if (e.beta === null || e.gamma === null) return;

    gyroBeta = e.beta || 0;
    gyroGamma = e.gamma || 0;
    const beta2zero = gyroBeta - gyroBetaZero;
    const gamma2zero = gyroGamma - gyroGammaZero;
    document.getElementById('gyro-indicator').textContent =
        `絶対値:β${e.beta.toFixed(1)}° γ${e.gamma.toFixed(1)}°,ゼロ点: β${gyroBetaZero.toFixed(1)}° γ${gyroGammaZero.toFixed(1)}°, 差分: β${beta2zero.toFixed(1)}° γ${gamma2zero.toFixed(1)}°`;
    
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

}

// ジャイロ関連フラグのリセット
export function resetCalibration() {
    gyroEnabled = false;
    gyroCalibrated = false;
    lastBeta = Infinity;
    lastGamma = Infinity;
}

// ジャイロの値からボールの向き変化を計算する
function calculateHeadingDeltaFromGyro(dt){
    const beta2zero = Math.max(-45, Math.min(45, gyroBeta  - gyroBetaZero));
    return (beta2zero / 45) * Ball.HEADING_SCALE * dt;
}

// ジャイロの値からボールにかかる力を計算する
export function calculateForceFromGyro(ball, dt){
    const headingDelta = calculateHeadingDeltaFromGyro(dt);
    ball.heading += headingDelta;
    const heading = ball.heading;
    const gamma2zero  = Math.max(-45, Math.min(45, gyroGamma - gyroGammaZero));
    const forwardForce = (gamma2zero / 45) * Ball.FORCE_SCALE;
    const fx = Math.sin(heading) * forwardForce;
    const fz = -Math.cos(heading) * forwardForce;
    return new CANNON.Vec3(fx, 0, fz);
}


