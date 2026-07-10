import { showTitlePage } from './ui/titlePage.js';
import { showModeSelectPage } from './ui/modeSelectPage';
import { showTutorialSkipPage } from './ui/tutorialSkipPage.js';
import { showGameOverPage } from './ui/gameOverPage.js';
import { showGameClearPage } from './ui/gameClearPage.js';

export function registerRouterEvents() {
    window.addEventListener('load', showTitlePage);
    window.addEventListener('title-exit', showModeSelectPage);
    window.addEventListener('tutorial-skip-trigger', showTutorialSkipPage);
    window.addEventListener('game-over', showGameOverPage);
    window.addEventListener('game-clear', showGameClearPage);
    window.addEventListener('back-to-mode-select', showModeSelectPage);
}

