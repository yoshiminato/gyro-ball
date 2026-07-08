// ============================================================
// main.js - コントローラー・メインループ
// ============================================================

// import { showStartPage } from './ui/startPage.js';
import { registerRouterEvents } from './router.js';

import { 
    initRenderer, createCubeMesh, renderer, scene, camera,
    ballLight, neonLight1, neonLight2, obstacles 
} from './core/renderer.js';

import { 
    initPhysics, createBallBody, createCubeBody, world, setupCollisionHandler
} from './core/physics.js';

import { requestGyro, resetCalibration } from './input/gyro.js';

import { registerKeyEvent} from './input/keyboard.js';

import {registerTouchEvent} from './input/touch.js';

import { Ball } from './object/ball.js';

import { Cube } from './object/cube.js';

import { Snake } from './object/snake.js';

let ball = null;
let cube = null;
let snale = null;

const CAM_DIST = 14;
const CAM_HEIGHT = 8;

let lastTime = performance.now();
let started = false;
let totalDist = 0;
const camTarget = new THREE.Vector3();

// 障害物データ定義
const obstacleDefs = [
    // [-20, -10, 12, 2, 1], [-10, -10, 12, 2, 1], [0, -10, 12, 2, 1],
    // [20, 15, 1, 3, 12], [-20, 15, 1, 3, 12],
    // [10, 5, 3, 4, 3], [-10, 5, 3, 4, 3],
    // [0, 20, 8, 1.5, 1], [0, -20, 8, 1.5, 1],
    // [15, -15, 2, 2, 2], [-15, 15, 2, 2, 2],
    // [25, 0, 3, 3, 3], [-25, 5, 2, 2.5, 2],
    // [5, 30, 1.5, 4, 1.5], [-5, -30, 1.5, 4, 1.5],
    // [30, -20, 2, 1.5, 2], [-30, 20, 2, 1.5, 2],
    // [10, -25, 4, 1, 4], [-10, 25, 4, 1, 4],
    // [35, 10, 1.5, 5, 1.5], [-35, -10, 1.5, 5, 1.5],
    // [20, 30, 2, 2, 2], [-20, -30, 2, 2, 2],
];

setupEvents();

// window.onload = showStartPage;

window.addEventListener('game-start', init);

function init() {

    initRenderer();
    
    // 物理世界の初期化（レンダラー側の配列への参照を渡す）
    initPhysics(obstacles);
    ball = new Ball(); 
    // cube = new Cube(6, 0, 3, 3, 3);
    // snale = new Snake(7, 7);
    setupCollisionHandler(obstacles);

    // 障害物の生成（MeshとBodyをIDで紐づけ）
    const boxMat = world.materials.find(m => m.name === 'box');
    obstacleDefs.forEach((def, i) => {
        const id = i + 1000; // 固有ID
        createCubeMesh(def[0], def[1], def[2], def[3], def[4], i, id);
        createCubeBody(def[0], def[1], def[2], def[3], def[4], id, boxMat);
    });

    resetCalibration();
    requestGyro();
    lastTime = performance.now();
    started = true;


    
    // 初回描画
    renderer.render(scene, camera);

}

function setupEvents() {
    registerRouterEvents();
    registerKeyEvent(ball);
    registerTouchEvent(ball);
}

// function setupInputEvents() {
//     registerKeyEvent(ball);
//     registerTouchEvent(ball);

//     // ball.resetHeading();
//     // resetCalibration();
//     // requestGyro();
//     // lastTime = performance.now();
//     // started = true;
//     // animate();
// }


// メインループ
function animate() {
    requestAnimationFrame(animate);
    if (!started) return;
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    let fx = 0, fz = 0, forwardForce = 0;

    ball.judgeCanJump(world);

    ball.calculateForce(dt);
    ball.applyForce();

    ball.clampVelocity();

    // cube.chase(ball.body.position.x, ball.body.position.z);
    // snale.chase(ball.body.position.x, ball.body.position.z);

    // 物理シミュレーションを1ステップ進める
    world.step(1 / 60, dt, 3);

    ball.updateVisuals();
    // cube.updateVisuals();
    // snale.updateVisuals();

    // 距離計算
    const bp = ball.mesh.position;

    ballLight.position.copy(ball.mesh.position);
    ballLight.position.y += 0.5;

    // カメラ追従
    camTarget.lerp(ball.mesh.position, 0.08);
    const camOffsetX = -Math.sin(ball.heading) * CAM_DIST;
    const camOffsetZ = Math.cos(ball.heading) * CAM_DIST;

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

    ball.checkGrounded(world);
}