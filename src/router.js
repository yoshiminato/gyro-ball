import { showTitlePage } from './ui/titlePage.js';
import { showModeSelectPage } from './ui/modeSelectPage.js';
import { showGameOverPage } from './ui/gameOverPage.js';
import { showGameClearPage } from './ui/gameClearPage.js';

/**
 * CustomEventを対応する画面生成処理へ接続する。
 * 各リスナーはアプリ起動時に一度だけ登録する。
 * @returns {void}
 */
export function registerRouterEvents() {
    window.addEventListener('load', showTitlePage);
    window.addEventListener('title-exit', showModeSelectPage);
    window.addEventListener('game-over', showGameOverPage);
    window.addEventListener('game-clear', showGameClearPage);
    window.addEventListener('back-to-mode-select', showModeSelectPage);
}
