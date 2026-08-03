import {
    isFullscreenSupported,
    isGameFullscreen,
    requestGameFullscreen
} from '../util.js';

let registered = false;
let recoveryEnabled = false;
let recoveryButton = null;

/** 画面遷移と全画面解除を監視し、必要なときだけ復帰導線を表示する。 */
export function registerFullscreenControl() {
    if (registered) return;
    registered = true;

    window.addEventListener('title-exit', enableFullscreenRecovery);
    [
        'game-start',
        'game-started',
        'game-start-failed',
        'game-over',
        'game-clear',
        'back-to-mode-select'
    ].forEach((eventName) => {
        window.addEventListener(eventName, handleScreenTransition);
    });

    document.addEventListener('fullscreenchange', updateRecoveryButton);
    document.addEventListener('webkitfullscreenchange', updateRecoveryButton);
}

function enableFullscreenRecovery() {
    recoveryEnabled = true;
    handleScreenTransition();
}

function hasUserActivation() {
    return !navigator.userActivation || navigator.userActivation.isActive;
}

/** ユーザー操作中の画面遷移なら、その操作権限を使って全画面へ戻す。 */
async function handleScreenTransition() {
    updateRecoveryButton();
    if (
        !recoveryEnabled
        || isGameFullscreen()
        || !isFullscreenSupported()
        || !hasUserActivation()
    ) return;

    await requestGameFullscreen();
    updateRecoveryButton();
}

function updateRecoveryButton() {
    const shouldShow = recoveryEnabled
        && isFullscreenSupported()
        && !isGameFullscreen();

    if (!shouldShow) {
        recoveryButton?.remove();
        recoveryButton = null;
        return;
    }

    if (recoveryButton) return;

    recoveryButton = document.createElement('button');
    recoveryButton.id = 'fullscreen-recovery-button';
    recoveryButton.type = 'button';
    recoveryButton.textContent = '⛶ 全画面に戻る';
    recoveryButton.setAttribute('aria-label', '全画面表示に戻る');
    recoveryButton.addEventListener('click', restoreFullscreen);
    document.body.appendChild(recoveryButton);
}

async function restoreFullscreen() {
    if (!recoveryButton) return;

    recoveryButton.disabled = true;
    recoveryButton.textContent = '全画面へ切り替え中…';
    const restored = await requestGameFullscreen();

    if (!restored && recoveryButton) {
        recoveryButton.disabled = false;
        recoveryButton.textContent = '⛶ 全画面に戻る';
    }
    updateRecoveryButton();
}
