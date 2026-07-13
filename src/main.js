// ============================================================
// main.js - コントローラー・メインループ
// ============================================================

import { started, destroyGameFlg, ball, destroyGame, startGame, updateGameState } from './gameController.js';

import { Opponent, Difficulty } from './constants.js';

import { registerRouterEvents } from './router.js';

import { 
    initRenderer, createCubeMesh, renderer, scene, camera,
    ballLight, neonLight1, neonLight2, obstacles , destroyRenderer
} from './core/renderer.js';

import { 
    initPhysics, createBallBody, createCubeBody, world, setupCollisionHandler, destroyPhysics
} from './core/physics.js';

import { requestGyro, resetCalibration } from './input/gyro.js';

import { registerKeyEvent} from './input/keyboard.js';

import {registerTouchEvent} from './input/touch.js';

import { Ball } from './object/ball.js';

import { Cube } from './object/cube.js';

import { Snake } from './object/snake.js';


const CAM_DIST = 14;
const CAM_HEIGHT = 8;

let lastTime = performance.now();
let totalDist = 0;
const camTarget = new THREE.Vector3();


registerRouterEvents();
animate();

window.addEventListener('game-start', init);


function init(e) {

    try{
        startGame();
    }
    catch(err){
        console.warn('ゲーム初期化失敗')
        console.log(err)
    }

    // snake = new Snake(7, 7);
    setupCollisionHandler(obstacles);
    setupEvents();


    resetCalibration();
    requestGyro();
    lastTime = performance.now();
    
    // 初回描画
    renderer.render(scene, camera);

}

function setupEvents() {
    registerKeyEvent(ball);
    registerTouchEvent(ball);
}


// メインループ
function animate() {
    requestAnimationFrame(animate);
    if(destroyGameFlg) destroyGame();
    if (!started) return;
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    updateGameState(dt);

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
}