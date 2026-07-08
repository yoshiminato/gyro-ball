export function showModeSelectPage() {

    // 背景画像の設定
    document.body.style.backgroundImage = "url('asset/img/gameView.png')";
    document.body.style.backgroundPosition = "center center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";

    // wrapperの作成
    const modeSelectOverlay = document.createElement('div');
    modeSelectOverlay.id = 'mode-select-overlay';

    // タイトル
    const titleText = document.createElement('h1');
    titleText.id = 'title-mode-select-page';
    titleText.textContent = 'モード選択';

    /***
     * キューブ 
    ***/

    // 全体のラッパー
    const cubeModeWrapper = document.createElement('div');
    cubeModeWrapper.className = 'cube-mode-wrapper';
    cubeModeWrapper.className = 'mode-wrapper';

    // 敵のキューブの画像 or gif 
    const cubeModeEnemyImg = document.createElement('img');
    cubeModeEnemyImg.className = 'cube-mode-enemy-img';
    cubeModeEnemyImg.src = 'asset/img/cube.gif';
    cubeModeEnemyImg.alt = 'Cube Enemy';

    // 難易度選択UIのラッパー
    const cubeModeDifficultySelectUiWrapper = document.createElement('div');
    cubeModeDifficultySelectUiWrapper.className = 'difficulty-select-ui-wrapper';
    
    // 難易度選択のボタン
    const cubeEasyBtn = document.createElement('button');
    const cubeMediumBtn = document.createElement('button');
    const cubeHardBtn = document.createElement('button');
    cubeEasyBtn.className = 'difficulty-btn';
    cubeEasyBtn.classList.add('easy-btn');
    cubeMediumBtn.className = 'difficulty-btn';
    cubeMediumBtn.classList.add('medium-btn');
    cubeHardBtn.className = 'difficulty-btn';
    cubeHardBtn.classList.add('hard-btn');
    // 難易度選択
    cubeEasyBtn.addEventListener('click', () => {
        console.log('Cube: Easy mode selected');
    });
    cubeMediumBtn.addEventListener('click', () => {
        console.log('Cube: Medium mode selected');
    });
    cubeHardBtn.addEventListener('click', () => {
        console.log('Cube: Hard mode selected');
    });


    /***
     * スネーク
    ***/

    // 全体のラッパー
    const snakeModeWrapper = document.createElement('div');
    snakeModeWrapper.className = 'snake-mode-wrapper';
    // 💡 前のクラスを上書きしないよう、共通クラスは classList.add で追加するのが安全です
    snakeModeWrapper.classList.add('mode-wrapper');

    // 敵のスネークの画像 or gif 
    const snakeModeEnemyImg = document.createElement('img');
    snakeModeEnemyImg.className = 'snake-mode-enemy-img';
    snakeModeEnemyImg.src = 'asset/img/snake.gif'; // スネーク用の画像パス
    snakeModeEnemyImg.alt = 'Snake Enemy';

    // 難易度選択UIのラッパー
    const snakeModeDifficultySelectUiWrapper = document.createElement('div');
    snakeModeDifficultySelectUiWrapper.className = 'difficulty-select-ui-wrapper';
    
    // 難易度選択のボタン
    const snakeEasyBtn = document.createElement('button');
    const snakeMediumBtn = document.createElement('button');
    const snakeHardBtn = document.createElement('button');
    
    snakeEasyBtn.className = 'difficulty-btn';
    snakeEasyBtn.classList.add('easy-btn');
    
    snakeMediumBtn.className = 'difficulty-btn';
    snakeMediumBtn.classList.add('medium-btn');
    
    snakeHardBtn.className = 'difficulty-btn';
    snakeHardBtn.classList.add('hard-btn');

    // 難易度選択のイベントリスナー
    snakeEasyBtn.addEventListener('click', () => {
        console.log('Snake: Easy mode selected');
    });
    snakeMediumBtn.addEventListener('click', () => {
        console.log('Snake: Medium mode selected');
    });
    snakeHardBtn.addEventListener('click', () => {
        console.log('Snake: Hard mode selected');
    });


    // ゲーム開始ボタン
    const gameStartBtn = document.createElement('button');
    gameStartBtn.id = 'game-start-btn';
    gameStartBtn.textContent = 'ゲーム開始';


    // 要素を追加
    cubeModeDifficultySelectUiWrapper.appendChild(cubeEasyBtn);
    cubeModeDifficultySelectUiWrapper.appendChild(cubeMediumBtn);
    cubeModeDifficultySelectUiWrapper.appendChild(cubeHardBtn);
    cubeModeWrapper.appendChild(cubeModeEnemyImg);
    cubeModeWrapper.appendChild(cubeModeDifficultySelectUiWrapper);

    snakeModeDifficultySelectUiWrapper.appendChild(snakeEasyBtn);
    snakeModeDifficultySelectUiWrapper.appendChild(snakeMediumBtn);
    snakeModeDifficultySelectUiWrapper.appendChild(snakeHardBtn);
    snakeModeWrapper.appendChild(snakeModeEnemyImg);
    snakeModeWrapper.appendChild(snakeModeDifficultySelectUiWrapper);

    modeSelectOverlay.appendChild(titleText);
    modeSelectOverlay.appendChild(cubeModeWrapper);
    modeSelectOverlay.appendChild(snakeModeWrapper);
    modeSelectOverlay.appendChild(gameStartBtn);
    document.body.appendChild(modeSelectOverlay);


    // 難易度ボタンのテキストを更新
    const easyBtns = document.querySelectorAll('.easy-btn');
    const mediumBtns = document.querySelectorAll('.medium-btn');
    const hardBtns = document.querySelectorAll('.hard-btn'); 
    easyBtns.forEach(btn => btn.textContent = 'Easy');
    mediumBtns.forEach(btn => btn.textContent = 'Medium');
    hardBtns.forEach(btn => btn.textContent = 'Hard');


   
    

}