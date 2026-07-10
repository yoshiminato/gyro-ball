import { Opponent, Difficulty } from '../constants.js';

export function showGameClearPage(event) {

    console.log('Game Clear Page: Displaying game clear dialog');

    // 背景のオーバーレイ
    const overlay = document.createElement('div');
    overlay.classList.add('game-clear-overlay');

    // ポップアップ
    const modal = document.createElement('div');
    modal.classList.add('game-clear-modal');

    // タイトル
    const title = document.createElement('h1');
    title.classList.add('game-clear-title');
    title.textContent = 'GAME CLEAR!';

    // 敵（データがない場合のフォールバック付き）
    const opponentText = document.createElement('p');
    opponentText.classList.add('game-clear-text');

    let opponentName = '---';
    if (event.detail && event.detail.opponent) {
        switch (event.detail.opponent) {
            case Opponent.CUBE:
                opponentName = 'Cube';
                break;
            case Opponent.SNAKE:
                opponentName = 'Snake';
                break;
        }
    }
    opponentText.textContent = `撃破した敵：${opponentName}`;

    // 難易度（データがない場合のフォールバック付き）
    const difficultyText = document.createElement('p');
    difficultyText.classList.add('game-clear-text');

    let difficultyName = '---';
    if (event.detail && event.detail.difficulty) {
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
    }
    difficultyText.textContent = `難易度：${difficultyName}`;

    // ボタンコンテナ
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('game-clear-btn-container');

    const retryButton = document.createElement('button');
    retryButton.classList.add('game-clear-btn', 'game-clear-btn-retry');
    retryButton.textContent = 'もう一度遊ぶ';

    const modeSelectButton = document.createElement('button');
    modeSelectButton.classList.add('game-clear-btn', 'game-clear-btn-mode');
    modeSelectButton.textContent = 'モード選択に戻る';

    // 前回の解説を踏まえ、より安全な .remove() でモーダルを削除しています
    retryButton.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('game-start', {
            detail: {
                opponent: event.detail?.opponent ?? Opponent.CUBE,
                difficulty: event.detail?.difficulty ?? Difficulty.NORMAL
            }
        }));
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