export function showTutorialSkipPage(event) {

    console.log('Tutorial Skip Page: Displaying tutorial skip confirmation dialog');

    // 背景のオーバーレイ
    const overlay = document.createElement('div');
    overlay.classList.add('tutorial-skip-overlay');

    // ポップアップの小画面
    const modal = document.createElement('div');
    modal.classList.add('tutorial-skip-modal');

    // テキスト
    const text = document.createElement('p');
    text.classList.add('tutorial-skip-text');
    text.innerText = 'チュートリアルをスキップしますか？';

    // ボタンのコンテナ
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('tutorial-skip-btn-container');

    // ボタン
    const yesButton = document.createElement('button');
    yesButton.classList.add('tutorial-skip-btn', 'tutorial-skip-btn-yes');
    yesButton.innerText = 'はい';
    const noButton = document.createElement('button');
    noButton.classList.add('tutorial-skip-btn', 'tutorial-skip-btn-no');
    noButton.innerText = 'いいえ';

    // --- クリックイベントの処理 ---
    yesButton.addEventListener('click', () => {
      console.log(event.detail.mode)
      console.log(event.detail.difficulty)
      console.log('Tutorial Skip Page: User chose to skip the tutorial');
      const gameStartEvent = new CustomEvent('game-start', {
        detail: { mode: event.detail.mode, difficulty: event.detail.difficulty, skipTutorial: true }
      });
      window.dispatchEvent(gameStartEvent);
      document.body.removeChild(overlay);
    });

    noButton.addEventListener('click', () => {
      console.log(event.detail.mode)
      console.log(event.detail.difficulty)
      console.log('Tutorial Skip Page: User chose not to skip the tutorial');
      const gameStartEvent = new CustomEvent('game-start', {
        detail: { mode: event.detail.mode, difficulty: event.detail.difficulty, skipTutorial: false }
      });
      window.dispatchEvent(gameStartEvent);
      document.body.removeChild(overlay);
    });

    // --- 要素の組み立て ---
    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);
    modal.appendChild(text);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);

    // 画面に追加
    document.body.appendChild(overlay);
}