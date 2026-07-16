import { opponent, difficulty } from '../gameController.js';
import { Opponent, Difficulty } from '../constants.js';

export async function hundleTutorial(event) {

    // チュートリアルをスキップするか否か
    const skipTutorial = event.detail.skipTutorial;

    if (skipTutorial) 
        return;

    switch (Number(opponent)) {
        case Opponent.CUBE:
            break;
        case Opponent.SNAKE:
            break;
        default:
            console.error(`Unknown opponent: ${opponent}`);
    }



}