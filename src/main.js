import {
    ball,
    destroyGame,
    startGame,
    started,
    updateGameState
} from './gameController.js';
import { registerRouterEvents } from './router.js';
import {
    ballLight,
    camera,
    neonLight1,
    neonLight2,
    renderer,
    scene
} from './core/renderer.js';
import { registerKeyEvent } from './input/keyboard.js';
import { registerTouchEvent } from './input/touch.js';
import { registerPauseUi } from './ui/pausePage.js';
import { registerFullscreenControl } from './ui/fullscreenControl.js';
import { registerBgmEvents } from './audioManager.js';
import { isMobileDevice } from './util.js';
import {
    applyCameraShake,
    beginCameraFrame,
    updateHitEffects
} from './core/hitEffects.js';

// プレイヤーを背後から追従するカメラの距離と高さ。
const CAM_DIST = 14;
const CAM_HEIGHT = 8;

let lastTime = performance.now();
const camTarget = new THREE.Vector3();

// アプリ全体で一度だけ登録する画面遷移・UI・音声イベント。
registerRouterEvents();
registerPauseUi();
registerFullscreenControl();
registerBgmEvents();
showControlHint();
animate();

window.addEventListener('game-start', init);

/**
 * 端末に応じた操作説明を常設UIへ表示する。
 * @returns {void}
 */
function showControlHint() {
    const controlHint = document.getElementById('keyboard-hint');
    if (!controlHint) return;

    controlHint.textContent = isMobileDevice()
        ? '移動：端末を傾ける　ジャンプ：画面をタップ'
        : '移動：WASD / 矢印キー　ジャンプ：スペースキー';
}

/**
 * 選択中のモードでゲームを作り直し、入力対象を初期化する。
 * リトライ時にも同じ処理を使用する。
 * @returns {void}
 */
function init() {
    try {
        destroyGame();
        startGame();
        if (
            !ball?.mesh
            || !renderer
            || !scene
            || !camera
            || !ballLight
            || !neonLight1
            || !neonLight2
        ) {
            throw new Error('ゲームの必須オブジェクトを生成できませんでした');
        }

        setupEvents();
        lastTime = performance.now();

        // 次のrequestAnimationFrameを待たず、生成直後のシーンを表示する。
        renderer.render(scene, camera);
        window.dispatchEvent(new CustomEvent('game-started'));
    } catch (error) {
        console.error('ゲームの初期化に失敗しました', error);
        try {
            destroyGame();
        } catch (cleanupError) {
            console.error('初期化失敗後の後始末に失敗しました', cleanupError);
        }
        window.dispatchEvent(new CustomEvent('game-start-failed', {
            detail: {
                message: 'ゲームを開始できませんでした。もう一度お試しください。'
            }
        }));
    }
}

/**
 * 現在生成されているボールを各入力モジュールへ渡す。
 * @returns {void}
 */
function setupEvents() {
    registerKeyEvent(ball);
    registerTouchEvent(ball);
}

/**
 * 物理・カメラ・照明・描画を更新する常設ループ。
 * ゲーム停止中も次回開始に備えてrequestAnimationFrame自体は維持する。
 * @returns {void}
 */
function animate() {
    requestAnimationFrame(animate);
    if (
        !started
        || !ball?.mesh
        || !renderer
        || !scene
        || !camera
        || !ballLight
        || !neonLight1
        || !neonLight2
    ) return;

    const now = performance.now();
    // タブ復帰直後などの極端に大きい時間差を50msへ制限する。
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    updateGameState(dt);
    updateHitEffects(dt);

    ballLight.position.copy(ball.mesh.position);
    ballLight.position.y += 0.5;

    // 前フレームの揺れを除いてから通常の追従位置を計算する。
    beginCameraFrame(camera);
    // ボールの進行方向に対して後方から滑らかに追従する。
    camTarget.lerp(ball.mesh.position, 0.08);
    const camOffsetX = -Math.sin(ball.heading) * CAM_DIST;
    const camOffsetZ = Math.cos(ball.heading) * CAM_DIST;

    camera.position.lerp(
        new THREE.Vector3(camTarget.x + camOffsetX, camTarget.y + CAM_HEIGHT, camTarget.z + camOffsetZ), 
        0.07
    );
    applyCameraShake(camera);
    camera.lookAt(camTarget);

    // 2灯を異なる周期で周回させ、背景に動きを付ける。
    const t = now / 1000;
    neonLight1.position.x = Math.sin(t * 0.3) * 25;
    neonLight1.position.z = Math.cos(t * 0.3) * 25;
    neonLight2.position.x = Math.cos(t * 0.4) * 25;
    neonLight2.position.z = Math.sin(t * 0.4) * 25;

    renderer.render(scene, camera);
}
