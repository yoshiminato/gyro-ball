const tracks = {
    menu: createTrack('asset/audio/dark_things_loop.mp3', 0.3),
    game: createTrack('asset/audio/fight_looped.wav', 0.28),
    tutorial: createTrack('asset/audio/synthwavehouse.ogg', 0.22),
    gameClear: createTrack('asset/audio/winfretless.ogg', 0.4, false),
    gameOver: createTrack('asset/audio/GameOver.ogg', 0.4, false)
};

let currentTrack = null;
let playbackRequested = false;

function createTrack(src, volume, loop = true) {
    const audio = new Audio(src);
    audio.loop = loop;
    audio.preload = 'auto';
    audio.volume = volume;
    audio.addEventListener('ended', () => {
        if (currentTrack === audio) playbackRequested = false;
    });
    return audio;
}

async function startPlayback() {
    if (!currentTrack || !playbackRequested) return;

    try {
        await currentTrack.play();
    } catch (error) {
        // 自動再生が拒否された場合は、次のユーザー操作時に再試行する。
        if (
            error?.name !== 'NotAllowedError'
            && error?.name !== 'AbortError'
        ) {
            console.warn('BGMを再生できませんでした', error);
        }
    }
}

function playTrack(track) {
    if (currentTrack !== track) {
        if (currentTrack) {
            currentTrack.pause();
            currentTrack.currentTime = 0;
        }
        currentTrack = track;
    }

    playbackRequested = true;
    startPlayback();
}

export function registerBgmEvents() {
    window.addEventListener('title-exit', playMenuBgm);
    window.addEventListener('back-to-mode-select', playMenuBgm);

    // ブラウザに自動再生を拒否された場合の再試行用。
    document.addEventListener('pointerdown', startPlayback);
    document.addEventListener('keydown', startPlayback);
}

export function playMenuBgm() {
    playTrack(tracks.menu);
}

export function playGameBgm(isTutorial) {
    playTrack(isTutorial ? tracks.tutorial : tracks.game);
}

export function playGameClearBgm() {
    playTrack(tracks.gameClear);
}

export function playGameOverBgm() {
    playTrack(tracks.gameOver);
}

export function pauseBgm() {
    playbackRequested = false;
    currentTrack?.pause();
}

export function resumeBgm() {
    if (!currentTrack) return;
    playbackRequested = true;
    startPlayback();
}

export function stopBgm() {
    playbackRequested = false;

    if (!currentTrack) return;
    currentTrack.pause();
    currentTrack.currentTime = 0;
    currentTrack = null;
}
