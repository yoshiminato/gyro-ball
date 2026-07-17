import { Opponent, Difficulty } from '../constants.js';
import { opponent, difficulty, updateOpponentAndDifficulty } from '../gameController.js';

export function showModeSelectPage() {
    injectModeSelectStyles();

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

function injectModeSelectStyles() {
    if (document.getElementById('mode-select-page-styles')) return;

    const style = document.createElement('style');
    style.id = 'mode-select-page-styles';
    style.textContent = `
        #mode-select-overlay {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 24px;
            padding: 32px 20px;
            box-sizing: border-box;
            background: rgba(8, 10, 24, 0.45);
        }

        #title-mode-select-page {
            margin: 0;
            color: #ffffff;
            letter-spacing: 0.08em;
            text-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);
        }

        .opponent-cards-container {
            width: min(960px, 100%);
            display: flex;
            /* 画面比率にかかわらず、CubeとSnakeは常に横に並べる */
            flex-wrap: nowrap;
            justify-content: center;
            align-items: stretch;
            gap: clamp(8px, 2.5vw, 24px);
        }

        .opponent-container {
            /* 2枚が親要素の幅を均等に分け合う */
            flex: 1 1 0;
            width: auto;
            min-width: 0;
            max-width: 420px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: clamp(10px, 2vw, 18px);
            padding: clamp(10px, 2.5vw, 24px) clamp(8px, 2vw, 20px);
            border-radius: clamp(14px, 2.5vw, 24px);
            background: rgba(10, 18, 34, 0.78);
            border: 2px solid rgba(255, 255, 255, 0.14);
            box-shadow: 0 18px 40px rgba(0, 0, 0, 0.3);
            box-sizing: border-box;
            transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .selected-opponent {
            transform: translateY(-4px);
            border-color: rgba(111, 226, 255, 0.9);
            box-shadow: 0 22px 44px rgba(0, 0, 0, 0.36);
        }

        .opponent-image-frame {
            width: 100%;
            aspect-ratio: 1 / 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            border-radius: 18px;
            background:
                radial-gradient(circle at top, rgba(130, 213, 255, 0.2), transparent 55%),
                rgba(255, 255, 255, 0.06);
            box-sizing: border-box;
            overflow: hidden;
        }

        .opponent-enemy-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
            filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.35));
        }

        .difficulty-select-ui-wrapper {
            width: 100%;
            display: grid;
            /* 難易度は各カード内で縦に並べる */
            grid-template-columns: 1fr;
            gap: 12px;
        }

        .difficulty-btn,
        #game-start-btn {
            border: none;
            border-radius: 999px;
            padding: 12px 16px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
        }

        .difficulty-btn.selected {
            outline: 3px solid rgba(255, 255, 255, 0.85);
            outline-offset: 1px;
        }

        .tutorial-btn { background: #fff2a8; color: #3f3300; }
        .easy-btn { background: #9cf2b2; color: #083d18; }
        .medium-btn { background: #ffd27d; color: #4e2800; }
        .hard-btn { background: #ff9d9d; color: #4d0303; }

        #game-start-btn {
            min-width: min(280px, 100%);
            background: linear-gradient(135deg, #66e4ff, #45b8ff);
            color: #062338;
            box-shadow: 0 14px 30px rgba(34, 158, 215, 0.35);
        }

        @media (max-width: 768px) {
            #mode-select-overlay {
                justify-content: flex-start;
                gap: 16px;
                padding: 24px 10px;
            }

            .opponent-container {
                padding: 12px 8px;
            }

            .difficulty-select-ui-wrapper {
                grid-template-columns: 1fr;
                gap: 8px;
            }

            .difficulty-btn {
                padding: 9px 6px;
                font-size: clamp(12px, 3.5vw, 15px);
            }

            .opponent-image-frame {
                padding: 8px;
            }
        }
    `;

    document.head.appendChild(style);
}
