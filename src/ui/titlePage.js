import { isMobileDevice, setupGameScreen } from '../util.js';

// ゲーム開始時にスタート画面の削除
window.addEventListener('title-exit', () => {
    const startOverlay = document.getElementById('start-overlay');
    if (startOverlay) 
        startOverlay.remove();
});

/**
 * タイトルとゲーム開始ボタンを持つ初期画面を生成する。
 * @returns {void}
 */
export function showTitlePage() {

    // wrapperの作成
    const startOverlay = document.createElement('div');
    startOverlay.id = 'start-overlay';
    
    // タイトル
    const titleText = document.createElement('h1');
    titleText.id = 'title-start-page';
    titleText.textContent = '🌀 ローリング バトル';

    // 説明文
    const descriptionText = document.createElement('p');
    descriptionText.id = 'description-start-page';
    descriptionText.textContent = 'ボールを操作し、相手に体当たりをして倒そう！';

    // スタートボタン(全画面・横画面要求のトリガ)
    const startBtn = document.createElement('button');
    startBtn.id = 'start-btn';
    startBtn.textContent = 'スタート！';
    startBtn.addEventListener('click', setupGameScreen);

    // 要素を追加
    startOverlay.appendChild(titleText);
    startOverlay.appendChild(descriptionText);
    startOverlay.appendChild(startBtn);
    document.body.appendChild(startOverlay);
}
