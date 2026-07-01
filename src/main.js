// ============================================================
// main.js - コントローラー・メインループ
// ============================================================

import { 
    initRenderer, createBallMesh, createCubeMesh, renderer, scene, camera,
    ballMesh, ballLight, neonLight1, neonLight2, obstacles 
} from './core/renderer.js';

import { 
    initPhysics, createBallBody, createCubeBody, world, ballBody, setupCollisionHandler
} from './core/physics.js';


const debug_elm = document.getElementById('gyro-value');
window.addEventListener('deviceorientation', (e) => {
    if (e.alpha !== null && e.beta !== null && e.gamma !== null) {
        debug_elm.textContent = `ジャイロ値: α${e.alpha.toFixed(1)}° β${e.beta.toFixed(1)}° γ${e.gamma.toFixed(1)}°`;
    }
}, true);

const BALL_R = 0.6;
const FORCE_SCALE = 60;
const HEADING_SCALE = 2.0;
const CAM_DIST = 14;
const CAM_HEIGHT = 8;

let gyroAlpha = 0, gyroBeta = 0, gyroGamma = 0;
let gyroEnabled = false;
let gyroCalibrated = false;
let gyroBetaZero = 0, gyroGammaZero = 0;
let heading = 0;
const keys = {};

let lastTime = performance.now();
let started = false;
let totalDist = 0;
const prevPos = new THREE.Vector3();
const camTarget = new THREE.Vector3();

// 障害物データ定義
const obstacleDefs = [
    [-20, -10, 12, 2, 1], [-10, -10, 12, 2, 1], [0, -10, 12, 2, 1],
    [20, 15, 1, 3, 12], [-20, 15, 1, 3, 12],
    [10, 5, 3, 4, 3], [-10, 5, 3, 4, 3],
    [0, 20, 8, 1.5, 1], [0, -20, 8, 1.5, 1],
    [15, -15, 2, 2, 2], [-15, 15, 2, 2, 2],
    [25, 0, 3, 3, 3], [-25, 5, 2, 2.5, 2],
    [5, 30, 1.5, 4, 1.5], [-5, -30, 1.5, 4, 1.5],
    [30, -20, 2, 1.5, 2], [-30, 20, 2, 1.5, 2],
    [10, -25, 4, 1, 4], [-10, 25, 4, 1, 4],
    [35, 10, 1.5, 5, 1.5], [-35, -10, 1.5, 5, 1.5],
    [20, 30, 2, 2, 2], [-20, -30, 2, 2, 2],
];

// 初期化シーケンス
init();

function init() {
    initRenderer();
    createBallMesh(BALL_R);
    
    // 物理世界の初期化（レンダラー側の配列への参照を渡す）
    initPhysics(obstacles);
    createBallBody(BALL_R);
    console.log("Ball body created:", ballBody);
    setupCollisionHandler(obstacles);

    // 障害物の生成（MeshとBodyをIDで紐づけ）
    const boxMat = world.materials.find(m => m.name === 'box');
    obstacleDefs.forEach((def, i) => {
        const id = i + 1000; // 固有ID
        createCubeMesh(def[0], def[1], def[2], def[3], def[4], i, id);
        createCubeBody(def[0], def[1], def[2], def[3], def[4], id, boxMat);
    });

    setupInputEvents();
    
    // 初回描画
    renderer.render(scene, camera);
}

// 共通ジャンプ
function triggerJump() {
    if (ballBody.position.y < 2.0) {
        ballBody.velocity.y = 25;
    }
}

function resetBall() {
    ballBody.position.set(0, BALL_R + 1, 0);
    ballBody.velocity.set(0, 0, 0);
    ballBody.angularVelocity.set(0, 0, 0);
    ballBody.quaternion.set(0, 0, 0, 1);
}

function setupInputEvents() {
    document.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'Space') triggerJump();
        if (e.code === 'KeyR') resetBall();
    });
    document.addEventListener('keyup', e => { keys[e.code] = false; });

    document.getElementById('start-btn').addEventListener('click', async () => {
        if (typeof screen.orientation !== 'undefined' && typeof screen.orientation.lock === 'function') {
            try {
                await document.documentElement.requestFullscreen();
                await screen.orientation.lock('landscape-primary');
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
                console.warn("画面固定に失敗:", error);
            }
        }
        heading = 0;
        gyroCalibrated = false;
        requestGyro();
        document.getElementById('start-overlay').style.display = 'none';
        prevPos.copy(new THREE.Vector3(0, BALL_R, 0));
        lastTime = performance.now();
        started = true;
        animate();
    });
}

const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
function requestGyro() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(perm => {
                if (perm === 'granted') {
                    enableGyro();
                    enableMotion();
                }
            }).catch(console.error);
    } else if (isMobile) {
        enableGyro();
        enableMotion();
    }
}

function enableGyro() {
    window.addEventListener('deviceorientation', (e) => {
        if (e.beta !== null && e.gamma !== null) {
            if (!gyroCalibrated) {
                gyroBetaZero = e.beta || 0;
                gyroGammaZero = e.gamma || 0;
                gyroCalibrated = true;
            }
            gyroBeta = e.beta || 0;
            gyroGamma = e.gamma || 0;
            gyroEnabled = true;

            const dBeta = gyroBeta - gyroBetaZero;
            const dGamma = gyroGamma - gyroGammaZero;
            document.getElementById('gyro-indicator').textContent =

                `絶対値:β${e.beta.toFixed(1)}° γ${e.gamma.toFixed(1)}°,ゼロ点: β${gyroBetaZero.toFixed(1)}° γ${gyroGammaZero.toFixed(1)}°, 差分: β${dBeta.toFixed(1)}° γ${dGamma.toFixed(1)}°`;
        }
    }, true);
}

function enableMotion() {
    let lastJumpTime = 0;
    window.addEventListener('devicemotion', (e) => {
        if (!e.acceleration) return;
        const ax = e.acceleration.x || 0;
        const ay = e.acceleration.y || 0;
        const az = e.acceleration.z || 0;
        const totalAcceleration = Math.sqrt(ax * ax + ay * ay + az * az);
        const now = performance.now();

        if (totalAcceleration > 18 && (now - lastJumpTime > 300)) {
            triggerJump();
            lastJumpTime = now;
        }
    }, true);
}

// メインループ
function animate() {
    requestAnimationFrame(animate);
    if (!started) return;
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    let fx = 0, fz = 0, forwardForce = 0;


    // キーボード入力の場合
    if(!gyroEnabled) {
        if (keys['ArrowUp'] || keys['KeyW']) forwardForce += FORCE_SCALE;
        if (keys['ArrowDown'] || keys['KeyS']) forwardForce -= FORCE_SCALE;
        if (keys['ArrowLeft'] || keys['KeyA']) heading -= HEADING_SCALE * dt;
        if (keys['ArrowRight'] || keys['KeyD']) heading += HEADING_SCALE * dt;
        fx += Math.sin(heading) * forwardForce;
        fz += -Math.cos(heading) * forwardForce;
    }
    // ジャイロ入力の場合
    else{
        const dBeta = Math.max(-45, Math.min(45, gyroBeta  - gyroBetaZero));
        const dGamma  = Math.max(-45, Math.min(45, gyroGamma - gyroGammaZero));
        heading += (dBeta / 45) * HEADING_SCALE * dt;
        forwardForce = (dGamma / 45) * FORCE_SCALE;
        fx += Math.sin(heading) * forwardForce;
        fz += -Math.cos(heading) * forwardForce;
    }

    if (fx !== 0 || fz !== 0) {
        const bp = ballBody.position;
        ballBody.applyForce(new CANNON.Vec3(fx, 0, fz), new CANNON.Vec3(bp.x, bp.y, bp.z));
    }

    const maxV = 15;
    if (ballBody.velocity.length() > maxV) {
        ballBody.velocity.scale(maxV / ballBody.velocity.length(), ballBody.velocity);
    }

    // 物理シミュレーションを1ステップ進める
    world.step(1 / 60, dt, 3);

    // Three.js側の位置・回転を物理ボディと同期
    ballMesh.position.copy(ballBody.position);
    ballMesh.quaternion.copy(ballBody.quaternion);

    // 距離計算
    const bp = ballMesh.position;
    const moved = bp.distanceTo(prevPos);
    if (moved > 0.01) {
        totalDist += moved;
        prevPos.copy(bp);
        document.getElementById('dist').textContent = totalDist.toFixed(1);
    }

    ballLight.position.copy(ballMesh.position);
    ballLight.position.y += 0.5;

    // カメラ追従
    camTarget.lerp(ballMesh.position, 0.08);
    const camOffsetX = -Math.sin(heading) * CAM_DIST;
    const camOffsetZ = Math.cos(heading) * CAM_DIST;

    camera.position.lerp(
        new THREE.Vector3(camTarget.x + camOffsetX, camTarget.y + CAM_HEIGHT, camTarget.z + camOffsetZ), 
        0.07
    );
    camera.lookAt(camTarget);

    // ネオンライトアニメーション
    const t = now / 1000;
    neonLight1.position.x = Math.sin(t * 0.3) * 25;
    neonLight1.position.z = Math.cos(t * 0.3) * 25;
    neonLight2.position.x = Math.cos(t * 0.4) * 25;
    neonLight2.position.z = Math.sin(t * 0.4) * 25;

    renderer.render(scene, camera);
}