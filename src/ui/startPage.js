import { isMobileDevice, setupGameScreen } from '../util.js';

// ゲーム開始時にスタート画面の削除
window.addEventListener('game-start', () => {
    const startOverlay = document.getElementById('start-overlay');
    if (startOverlay) 
        startOverlay.remove();
});

// スタート画面の表示
export function showStartPage() {

    // 背景画像の設定
    document.body.style.backgroundImage = "url('asset/img/gameView.png')";
    document.body.style.backgroundPosition = "center center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";

    // wrapperの作成
    const startOverlay = document.createElement('div');
    startOverlay.id = 'start-overlay';
    
    // タイトル
    const titleText = document.createElement('h1');
    titleText.id = 'title-start-page';
    titleText.textContent = '🌀 ジャイロ ボール';

    // 説明文
    const descriptionText = document.createElement('p');
    descriptionText.id = 'description-start-page';
    descriptionText.textContent = 'スマホを傾けてボールを操作し、相手に体当たりをして倒そう！';

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