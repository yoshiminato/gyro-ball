export async function hundleTutorial(event) {

    // チュートリアルをスキップするか否か
    const skipTutorial = event.detail.skipTutorial;

    if (skipTutorial) 
        return;

    // ゲームモード(対戦相手)
    const mode = event.detail.mode;

    switch (mode) {
        case 'cube':
            await import('./tutorial/tutorialCube.js').then(module => {
                module.startTutorialCube();
            });
            break;
        case 'ball':
            await import('./tutorial/tutorialBall.js').then(module => {
                module.startTutorialBall();
            });
            break;
        default:
            console.error(`Unknown mode: ${mode}`);
    }



}