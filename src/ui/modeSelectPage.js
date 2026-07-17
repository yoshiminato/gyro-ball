import { Opponent, Difficulty } from '../constants.js';
import { opponent, difficulty, updateOpponentAndDifficulty } from '../gameController.js';

export function showModeSelectPage() {
    // 背景画像の設定
    document.body.style.backgroundImage = "url('asset/img/gameView.png')";
    document.body.style.backgroundPosition = "center center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";

    // overlayの作成
    const modeSelectOverlay = document.createElement('div');
    modeSelectOverlay.id = 'mode-select-overlay';

    // タイトル
    const titleText = document.createElement('h1');
    titleText.id = 'title-mode-select-page';
    titleText.textContent = 'モード選択';

    // 敵ごとののコンテナ
    const opponentCardsContainer = document.createElement('div');
    opponentCardsContainer.className = 'opponent-cards-container';


    /***
     * キューブ 
    ***/

    // 全体のコンテナ
    const cubeContainer = document.createElement('div');
    cubeContainer.className = 'cube-card-container';
    cubeContainer.classList.add('opponent-container'); // 💡 className = ... だと上書きされちゃうのでclassListに変更！

    const cubeImageFrame = document.createElement('div');
    cubeImageFrame.className = 'opponent-image-frame';

    // 敵のキューブの画像 or gif 
    const cubeImg = document.createElement('img');
    cubeImg.className = 'cube-opponent-enemy-img opponent-enemy-img';
    cubeImg.src = 'asset/img/cube.png';
    cubeImg.alt = 'Cube Enemy';

    // 難易度選択UIのラッパー
    const cubeDifficultySelectUiWrapper = document.createElement('div');
    cubeDifficultySelectUiWrapper.className = 'difficulty-select-ui-wrapper';
    
    // 難易度選択のボタン
    const cubeTutorialBtn = document.createElement('button');
    const cubeEasyBtn = document.createElement('button');
    const cubeMediumBtn = document.createElement('button');
    const cubeHardBtn = document.createElement('button');

    cubeTutorialBtn.className = 'difficulty-btn';
    cubeTutorialBtn.classList.add('tutorial-btn');
    cubeTutorialBtn.dataset.opponent = Opponent.CUBE;
    cubeTutorialBtn.dataset.difficulty = Difficulty.TUTORIAL;
    cubeEasyBtn.className = 'difficulty-btn';
    cubeEasyBtn.classList.add('easy-btn');
    cubeEasyBtn.dataset.opponent = Opponent.CUBE;
    cubeEasyBtn.dataset.difficulty = Difficulty.EASY;
    cubeMediumBtn.className = 'difficulty-btn';
    cubeMediumBtn.classList.add('medium-btn');
    cubeMediumBtn.dataset.opponent = Opponent.CUBE;
    cubeMediumBtn.dataset.difficulty = Difficulty.NORMAL;
    cubeHardBtn.className = 'difficulty-btn';
    cubeHardBtn.classList.add('hard-btn');
    cubeHardBtn.dataset.opponent = Opponent.CUBE;
    cubeHardBtn.dataset.difficulty = Difficulty.HARD;
    
    


    /***
     * スネーク
    ***/

    // 全体のラッパー
    const snakeContainer = document.createElement('div');
    snakeContainer.className = 'snake-card-container';
    snakeContainer.classList.add('opponent-container');

    const snakeImageFrame = document.createElement('div');
    snakeImageFrame.className = 'opponent-image-frame';

    // 敵のスネークの画像 or gif 
    const snakeEnemyImg = document.createElement('img');
    snakeEnemyImg.className = 'snake-opponent-enemy-img opponent-enemy-img';
    snakeEnemyImg.src = 'asset/img/snake.png';
    snakeEnemyImg.alt = 'Snake Enemy';

    // 難易度選択UIのラッパー
    const snakeDifficultySelectUiWrapper = document.createElement('div');
    snakeDifficultySelectUiWrapper.className = 'difficulty-select-ui-wrapper';
    
    // 難易度選択のボタン
    const snakeTutorialBtn = document.createElement('button');
    const snakeEasyBtn = document.createElement('button');
    const snakeMediumBtn = document.createElement('button');
    const snakeHardBtn = document.createElement('button');

    snakeTutorialBtn.className = 'difficulty-btn';
    snakeTutorialBtn.classList.add('tutorial-btn');
    snakeTutorialBtn.dataset.opponent = Opponent.SNAKE;
    snakeTutorialBtn.dataset.difficulty = Difficulty.TUTORIAL;
    snakeEasyBtn.className = 'difficulty-btn';
    snakeEasyBtn.classList.add('easy-btn');
    snakeEasyBtn.dataset.opponent = Opponent.SNAKE;
    snakeEasyBtn.dataset.difficulty = Difficulty.EASY;
    snakeMediumBtn.className = 'difficulty-btn';
    snakeMediumBtn.classList.add('medium-btn');
    snakeMediumBtn.dataset.opponent = Opponent.SNAKE;
    snakeMediumBtn.dataset.difficulty = Difficulty.NORMAL;
    snakeHardBtn.className = 'difficulty-btn';
    snakeHardBtn.classList.add('hard-btn');
    snakeHardBtn.dataset.opponent = Opponent.SNAKE;
    snakeHardBtn.dataset.difficulty = Difficulty.HARD;


    const difficultyBtns = [
        cubeTutorialBtn,
        cubeEasyBtn,
        cubeMediumBtn,
        cubeHardBtn,
        snakeTutorialBtn,
        snakeEasyBtn,
        snakeMediumBtn,
        snakeHardBtn
    ];


    // 難易度選択のイベント
    cubeTutorialBtn.addEventListener('click', () => updateSelectedElm(cubeTutorialBtn));
    cubeEasyBtn.addEventListener('click',    () => updateSelectedElm(cubeEasyBtn));
    cubeMediumBtn.addEventListener('click',  () => updateSelectedElm(cubeMediumBtn));
    cubeHardBtn.addEventListener('click',    () => updateSelectedElm(cubeHardBtn));
    snakeTutorialBtn.addEventListener('click', () => updateSelectedElm(snakeTutorialBtn));
    snakeEasyBtn.addEventListener('click',   () => updateSelectedElm(snakeEasyBtn));
    snakeMediumBtn.addEventListener('click', () => updateSelectedElm(snakeMediumBtn));
    snakeHardBtn.addEventListener('click',   () => updateSelectedElm(snakeHardBtn));



    // ゲーム開始ボタン
    const gameStartBtn = document.createElement('button');
    gameStartBtn.id = 'game-start-btn';
    gameStartBtn.textContent = 'ゲーム開始';

    gameStartBtn.addEventListener('click', () => {
        console.log(`Selected opponent: ${opponent}, Selected Difficulty: ${difficulty}`);
        // Tutorial固有の処理は、今後game-start側でDifficulty.TUTORIALを判定して追加する
        const gameStartEvent = new CustomEvent('game-start');
        window.dispatchEvent(gameStartEvent);
    });


    // --- 要素の組み立て ---
    cubeDifficultySelectUiWrapper.appendChild(cubeTutorialBtn);
    cubeDifficultySelectUiWrapper.appendChild(cubeEasyBtn);
    cubeDifficultySelectUiWrapper.appendChild(cubeMediumBtn);
    cubeDifficultySelectUiWrapper.appendChild(cubeHardBtn);
    cubeImageFrame.appendChild(cubeImg);
    cubeContainer.appendChild(cubeImageFrame);
    cubeContainer.appendChild(cubeDifficultySelectUiWrapper);

    snakeDifficultySelectUiWrapper.appendChild(snakeTutorialBtn);
    snakeDifficultySelectUiWrapper.appendChild(snakeEasyBtn);
    snakeDifficultySelectUiWrapper.appendChild(snakeMediumBtn);
    snakeDifficultySelectUiWrapper.appendChild(snakeHardBtn);
    snakeImageFrame.appendChild(snakeEnemyImg);
    snakeContainer.appendChild(snakeImageFrame);
    snakeContainer.appendChild(snakeDifficultySelectUiWrapper);

    // 💡 敵の選択ラッパーは、新設したコンテナに入れる
    opponentCardsContainer.appendChild(cubeContainer);
    opponentCardsContainer.appendChild(snakeContainer);

    // 💡 全体のオーバーレイには「タイトル」「カードコンテナ」「開始ボタン」を縦に並べる
    modeSelectOverlay.appendChild(titleText);
    modeSelectOverlay.appendChild(opponentCardsContainer); 
    modeSelectOverlay.appendChild(gameStartBtn);
    
    document.body.appendChild(modeSelectOverlay);


    // 難易度ボタンのテキストを更新
    const tutorialBtns = document.querySelectorAll('.tutorial-btn');
    const easyBtns = document.querySelectorAll('.easy-btn');
    const mediumBtns = document.querySelectorAll('.medium-btn');
    const hardBtns = document.querySelectorAll('.hard-btn'); 
    tutorialBtns.forEach(btn => btn.textContent = 'チュートリアル');
    easyBtns.forEach(btn => btn.textContent = 'かんたん');
    mediumBtns.forEach(btn => btn.textContent = 'ふつう');
    hardBtns.forEach(btn => btn.textContent = 'むずかしい');

    window.addEventListener('game-start', () => {
        // ゲーム開始時にモード選択画面を非表示にする
        if (modeSelectOverlay.parentNode) {
            modeSelectOverlay.parentNode.removeChild(modeSelectOverlay);
        }
    });

    updateSelectedElm(cubeEasyBtn);

    function updateSelectedElm(selectedElm) {
        difficultyBtns.forEach(elm => elm.classList.remove('selected'));
        selectedElm.classList.add('selected');
        updateOpponentAndDifficulty(selectedElm.dataset.opponent, selectedElm.dataset.difficulty);
        gameStartBtn.textContent = Number(difficulty) === Difficulty.TUTORIAL
            ? 'チュートリアル開始'
            : 'ゲーム開始';

        cubeContainer.classList.remove('selected-opponent');
        snakeContainer.classList.remove('selected-opponent');
        if (opponent == Opponent.CUBE) cubeContainer.classList.add('selected-opponent');
        else snakeContainer.classList.add('selected-opponent');   
    }

    function removeModeSelectOverlay() {
        if (modeSelectOverlay.parentNode) {
            modeSelectOverlay.remove();
        }
    }
}
