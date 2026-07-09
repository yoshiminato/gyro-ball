export function showTutorialSkipPage() {
  return new Promise((resolve) => {

    console.log('Tutorial Skip Page: Displaying tutorial skip confirmation dialog');

    // 1. 背景のオーバーレイ
    const overlay = document.createElement('div');
    overlay.classList.add('tutorial-skip-overlay');

    // 2. ポップアップの小画面
    const modal = document.createElement('div');
    modal.classList.add('tutorial-skip-modal');

    // 3. テキスト
    const text = document.createElement('p');
    text.classList.add('tutorial-skip-text');
    text.innerText = 'チュートリアルをスキップしますか？';

    // 4. ボタンのコンテナ
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('tutorial-skip-btn-container');

    // 5. 「はい」ボタン
    const yesButton = document.createElement('button');
    yesButton.classList.add('tutorial-skip-btn', 'tutorial-skip-btn-yes');
    yesButton.innerText = 'はい';

    // 6. 「いいえ」ボタン
    const noButton = document.createElement('button');
    noButton.classList.add('tutorial-skip-btn', 'tutorial-skip-btn-no');
    noButton.innerText = 'いいえ';

    // --- クリックイベントの処理 ---
    yesButton.onclick = () => {
      document.body.removeChild(overlay);
      resolve(true); // スキップする
    };

    noButton.onclick = () => {
      document.body.removeChild(overlay);
      resolve(false); // スキップしない
    };

    // --- 要素の組み立て ---
    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);
    modal.appendChild(text);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);

    // 画面に追加
    document.body.appendChild(overlay);
  });
}