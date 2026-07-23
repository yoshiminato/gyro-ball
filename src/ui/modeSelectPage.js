import { Opponent, Difficulty } from '../constants.js';
import { updateOpponentAndDifficulty } from '../gameController.js';

export function showModeSelectPage() {
    const modeSelectOverlay = document.createElement('div');
    modeSelectOverlay.id = 'mode-select-overlay';

    const titleText = document.createElement('h1');
    titleText.id = 'title-mode-select-page';
    titleText.textContent = '難易度選択';

    const selectionPanel = document.createElement('div');
    selectionPanel.className = 'difficulty-selection-panel';

    // 敵は固定のため、選択カードではなく対戦相手の紹介として表示する
    const opponentIntro = document.createElement('section');
    opponentIntro.className = 'opponent-intro';
    opponentIntro.setAttribute('aria-label', '対戦相手');

    const opponentImageFrame = document.createElement('div');
    opponentImageFrame.className = 'opponent-image-frame';

    const snakeEnemyImg = document.createElement('img');
    snakeEnemyImg.className = 'opponent-enemy-img';
    snakeEnemyImg.src = 'asset/img/snake.png';
    snakeEnemyImg.alt = '対戦相手のスネーク';

    const opponentTextWrapper = document.createElement('div');
    opponentTextWrapper.className = 'opponent-text-wrapper';

    const opponentLabel = document.createElement('span');
    opponentLabel.className = 'selection-label';
    opponentLabel.textContent = '対戦相手';

    const opponentName = document.createElement('strong');
    opponentName.className = 'opponent-name';
    opponentName.textContent = 'SNAKE';

    opponentImageFrame.appendChild(snakeEnemyImg);
    opponentTextWrapper.appendChild(opponentLabel);
    opponentTextWrapper.appendChild(opponentName);
    opponentIntro.appendChild(opponentImageFrame);
    opponentIntro.appendChild(opponentTextWrapper);

    const tutorialSection = document.createElement('section');
    tutorialSection.className = 'tutorial-selection-section';

    const tutorialLabel = document.createElement('h2');
    tutorialLabel.className = 'selection-section-title';
    tutorialLabel.textContent = 'はじめて遊ぶ方';

    const difficultySection = document.createElement('section');
    difficultySection.className = 'difficulty-selection-section';

    const difficultyLabel = document.createElement('h2');
    difficultyLabel.className = 'selection-section-title';
    difficultyLabel.textContent = '難易度';

    const difficultyButtons = document.createElement('div');
    difficultyButtons.className = 'difficulty-select-ui-wrapper';

    const tutorialBtn = createDifficultyButton(
        'チュートリアル',
        'tutorial-btn',
        Difficulty.TUTORIAL
    );
    const easyBtn = createDifficultyButton(
        'かんたん',
        'easy-btn',
        Difficulty.EASY
    );
    const mediumBtn = createDifficultyButton(
        'ふつう',
        'medium-btn',
        Difficulty.NORMAL
    );
    const hardBtn = createDifficultyButton(
        'むずかしい',
        'hard-btn',
        Difficulty.HARD
    );
    const difficultyBtns = [tutorialBtn, easyBtn, mediumBtn, hardBtn];

    tutorialSection.appendChild(tutorialLabel);
    tutorialSection.appendChild(tutorialBtn);
    difficultyButtons.appendChild(easyBtn);
    difficultyButtons.appendChild(mediumBtn);
    difficultyButtons.appendChild(hardBtn);
    difficultySection.appendChild(difficultyLabel);
    difficultySection.appendChild(difficultyButtons);

    selectionPanel.appendChild(opponentIntro);
    selectionPanel.appendChild(tutorialSection);
    selectionPanel.appendChild(difficultySection);

    const gameStartBtn = document.createElement('button');
    gameStartBtn.id = 'game-start-btn';
    gameStartBtn.type = 'button';

    difficultyBtns.forEach((button) => {
        button.addEventListener('click', () => updateSelectedElm(button));
    });

    gameStartBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('game-start'));
    }, { once: true });

    modeSelectOverlay.appendChild(titleText);
    modeSelectOverlay.appendChild(selectionPanel);
    modeSelectOverlay.appendChild(gameStartBtn);
    document.body.appendChild(modeSelectOverlay);

    window.addEventListener('game-start', () => {
        modeSelectOverlay.remove();
    }, { once: true });

    // 通常プレイへの導線を優先し、「かんたん」を初期選択にする
    updateSelectedElm(easyBtn);

    function updateSelectedElm(selectedElm) {
        difficultyBtns.forEach((button) => {
            const isSelected = button === selectedElm;
            button.classList.toggle('selected', isSelected);
            button.setAttribute('aria-pressed', String(isSelected));
        });

        const selectedDifficulty = Number(selectedElm.dataset.difficulty);
        updateOpponentAndDifficulty(Opponent.SNAKE, selectedDifficulty);
        gameStartBtn.textContent =
            selectedDifficulty === Difficulty.TUTORIAL
                ? 'チュートリアル開始'
                : 'ゲーム開始';
    }
}

function createDifficultyButton(text, className, difficulty) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `difficulty-btn ${className}`;
    button.textContent = text;
    button.dataset.difficulty = difficulty;
    button.setAttribute('aria-pressed', 'false');
    return button;
}
