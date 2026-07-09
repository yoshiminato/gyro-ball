import { showTitlePage } from './ui/titlePage.js';
import { showModeSelectPage } from './ui/modeSelectPage';
import { showTutorialSkipPage } from './ui/tutorialSkipPage.js';

export function registerRouterEvents() {
    window.addEventListener('load', showTitlePage);
    window.addEventListener('title-exit', showModeSelectPage);
    window.addEventListener('tutorial-skip-trigger', showTutorialSkipPage);
}

