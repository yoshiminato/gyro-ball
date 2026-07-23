export const Opponent = {
    CUBE: 0,
    SNAKE: 1,
};

export const Difficulty = {
    TUTORIAL: -1,
    EASY: 0,
    NORMAL: 1,
    HARD: 2,
};

export const DifficultyNames = {
    [Difficulty.TUTORIAL]: 'Tutorial',
    [Difficulty.EASY]: 'Easy',
    [Difficulty.NORMAL]: 'Normal',
    [Difficulty.HARD]: 'Hard',
};

export const GameState = {
    IDLE: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAME_OVER: 3,
    GAME_CLEAR: 4,
}

// 旧正方形フィールドの一辺（50）を、新しい円形フィールドの半径にする
export const FIELD_RADIUS = 50;
