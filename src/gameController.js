import { destroyRenderer, initRenderer } from './core/renderer.js';
import { destroyPhysics,  initPhysics }  from './core/physics.js';
import { Ball } from './object/ball.js';
import { Cube } from './object/cube.js';
import { Snake } from './object/snake.js';
import { Opponent, Difficulty } from './constants.js';


// 物理演算器とレンダラを削除 & 各種変数を初期化
export function destroyGame() {
    const started = false;
    try{
        destroyRenderer();
    } catch(err){
        console.warn('レンダラー破棄失敗')
    }
    try{
        destroyPhysics();
    } catch(err){
        console.warn('物理エンジン破棄失敗')
    }
    const ball = null;
    const cube = null;
    const snake = null;
    return {
        started: started,
        ball: ball,
        cube: cube,
        snake: snake
    }
}

/// 物理演算器とレンダラを初期化
export function startGame(e){
    const started = true;
    initRenderer();
    initPhysics();

    const details = e.detail || {};
    const difficulty = details.difficulty || Difficulty.NORMAL;
    const opponent = details.opponent || Opponent.CUBE;

    const ball = new Ball();
    let cube = null;
    let snake = null;

    console.log(`Starting game with difficulty: ${difficulty}, opponent: ${opponent}`);

    switch(opponent){
        
        case Opponent.CUBE:
            cube = new Cube(difficulty);
            break;
        case Opponent.SNAKE:
            snake = new Snake(difficulty);
            break;
    }
    
    return { started, ball, cube, snake };
}