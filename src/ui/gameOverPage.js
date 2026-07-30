import { Opponent, Difficulty } from '../constants.js';
import { opponent, difficulty } from '../gameController.js';
import { getEnumKey } from '../util.js';

/**
 * 敗北結果と再開・モード選択ボタンを持つモーダルを表示する。
 * @returns {void}
 */
export function showGameOverPage() {
    // 背景のオーバーレイ
    const overlay = document.createElement('div');
    overlay.classList.add('game-over-overlay');

    // ポップアップ
    const modal = document.createElement('div');
    modal.classList.add('game-over-modal');

    // タイトル
    const title = document.createElement('h1');
    title.classList.add('game-over-title');
    title.textContent = 'GAME OVER';

    // 敵
    const opponentText = document.createElement('p');
    opponentText.classList.add('game-over-text');

    opponentText.textContent = `敵：${getEnumKey(Opponent, opponent)}`;

    // 難易度
    const difficultyText = document.createElement('p');
    difficultyText.classList.add('game-over-text');

    difficultyText.textContent = `難易度：${getEnumKey(Difficulty, difficulty)}`;

    // ボタン
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('game-over-btn-container');

    const retryButton = document.createElement('button');
    retryButton.classList.add('game-over-btn', 'game-over-btn-retry');
    retryButton.textContent = 'リトライ';

    const modeSelectButton = document.createElement('button');
    modeSelectButton.classList.add('game-over-btn', 'game-over-btn-mode');
    modeSelectButton.textContent = 'モード選択に戻る';

    retryButton.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('game-start'));
        overlay.remove();
    });

    modeSelectButton.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('back-to-mode-select'));
        overlay.remove();
    });

    buttonContainer.appendChild(retryButton);
    buttonContainer.appendChild(modeSelectButton);

    modal.appendChild(title);
    modal.appendChild(opponentText);
    modal.appendChild(difficultyText);
    modal.appendChild(buttonContainer);

    overlay.appendChild(modal);

    document.body.appendChild(overlay);


}
