// 対戦相手をイベントやUI間で受け渡すための識別値。
export const Opponent = {
    CUBE: 0,
    SNAKE: 1,
};

// 数値は難易度選択ボタンのdatasetにも格納される。
export const Difficulty = {
    TUTORIAL: -1,
    EASY: 0,
    NORMAL: 1,
    HARD: 2,
};

// 難易度別パラメータオブジェクトを参照するための共通キー。
export const DifficultyNames = {
    [Difficulty.TUTORIAL]: 'Tutorial',
    [Difficulty.EASY]: 'Easy',
    [Difficulty.NORMAL]: 'Normal',
    [Difficulty.HARD]: 'Hard',
};

// メインループとUIが共有するゲーム進行状態。
export const GameState = {
    IDLE: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAME_OVER: 3,
    GAME_CLEAR: 4,
};

// 旧正方形フィールドの一辺（50）を、新しい円形フィールドの半径にする
export const FIELD_RADIUS = 50;

// この速度未満の接触は押し合い・擦れとして扱い、敵へのダメージにしない
export const MIN_DAMAGE_IMPACT_SPEED = 3;
