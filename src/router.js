import { showTitlePage } from './ui/titlePage.js';
import { showModeSelectPage } from './ui/modeSelectPage';

export function registerRouterEvents() {
    window.addEventListener('load', showTitlePage);
    window.addEventListener('title-exit', showModeSelectPage);
}

