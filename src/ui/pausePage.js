import {
    gameState,
    pauseGame,
    resumeGame
} from '../gameController.js';
import { GameState } from '../constants.js';

let pauseButton = null;
let pauseOverlay = null;

export function registerPauseUi() {
    window.addEventListener('game-start', showPauseButton);
    window.addEventListener('game-over', removePauseUi);
    window.addEventListener('game-clear', removePauseUi);
    window.addEventListener('back-to-mode-select', removePauseUi);
    document.addEventListener('keydown', handleEscapeKey);
}

function showPauseButton() {
    removePauseUi();

    pauseButton = document.createElement('button');
    pauseButton.id = 'pause-button';
    pauseButton.type = 'button';
    pauseButton.textContent = '⏸';
    pauseButton.setAttribute('aria-label', 'ゲームをポーズする');
    pauseButton.addEventListener('click', openPauseOverlay);
    document.body.appendChild(pauseButton);
}

function openPauseOverlay() {
    if (!pauseGame()) return;

    pauseOverlay = document.createElement('div');
    pauseOverlay.className = 'pause-overlay';

    const modal = document.createElement('div');
    modal.className = 'pause-modal';

    const title = document.createElement('h2');
    title.className = 'pause-title';
    title.textContent = 'PAUSE';

    const resumeButton = document.createElement('button');
    resumeButton.className = 'pause-menu-button pause-resume-button';
    resumeButton.type = 'button';
    resumeButton.textContent = 'ゲームに戻る';
    resumeButton.addEventListener('click', closePauseOverlay, { once: true });

    const modeSelectButton = document.createElement('button');
    modeSelectButton.className = 'pause-menu-button pause-mode-button';
    modeSelectButton.type = 'button';
    modeSelectButton.textContent = 'モード選択に戻る';
    modeSelectButton.addEventListener('click', () => {
        removePauseUi();
        window.dispatchEvent(new CustomEvent('back-to-mode-select'));
    }, { once: true });

    modal.appendChild(title);
    modal.appendChild(resumeButton);
    modal.appendChild(modeSelectButton);
    pauseOverlay.appendChild(modal);
    document.body.appendChild(pauseOverlay);
}

function closePauseOverlay() {
    resumeGame();
    pauseOverlay?.remove();
    pauseOverlay = null;
}

function removePauseUi() {
    pauseOverlay?.remove();
    pauseButton?.remove();
    pauseOverlay = null;
    pauseButton = null;
}

function handleEscapeKey(event) {
    if (
        event.code !== 'Escape'
        || (
            gameState !== GameState.PLAYING
            && gameState !== GameState.PAUSED
        )
    ) return;

    if (gameState === GameState.PAUSED) {
        closePauseOverlay();
    } else {
        openPauseOverlay();
    }
}
