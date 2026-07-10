import { Opponent, Difficulty } from '../constants.js';

export function showGameOverPage(event) {

    console.log('Game Over Page: Displaying game over dialog');

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

    let opponentName = null;
    switch (event.detail.opponent) {
        case Opponent.CUBE:
            opponentName = 'Cube';
            break;
        case Opponent.SNAKE:
            opponentName = 'Snake';
            break;
    }

    opponentText.textContent = `敵：${opponentName}`;

    // 難易度
    const difficultyText = document.createElement('p');
    difficultyText.classList.add('game-over-text');

    let difficultyName = 'Unknown';
    switch (Number(event.detail.difficulty)) {
        case Difficulty.EASY:
            difficultyName = 'Easy';
            break;
        case Difficulty.NORMAL:
            difficultyName = 'Normal';
            break;
        case Difficulty.HARD:
            difficultyName = 'Hard';
            break;
    }

    difficultyText.textContent = `難易度：${difficultyName}`;

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
        window.dispatchEvent(new CustomEvent('game-start', {
            detail: {
                opponent: event.detail.opponent,
                difficulty: event.detail.difficulty
            }
        }));
        document.body.removeChild(overlay);
    });

    modeSelectButton.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('back-to-mode-select'));
        document.body.removeChild(overlay);
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