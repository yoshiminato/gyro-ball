// 用途ごとにAudio要素を一度だけ生成し、画面遷移時に再利用する。
const tracks = {
    menu: createTrack('asset/audio/dark_things_loop.mp3', 0.3),
    game: createTrack('asset/audio/fight_looped.wav', 0.28),
    tutorial: createTrack('asset/audio/synthwavehouse.ogg', 0.22),
    gameClear: createTrack('asset/audio/winfretless.ogg', 0.4, false),
    gameOver: createTrack('asset/audio/GameOver.ogg', 0.4, false)
};

let currentTrack = null;
let playbackRequested = false;

/**
 * 音量・ループ設定済みのAudio要素を生成する。
 * @param {string} src - 音声ファイルのパス
 * @param {number} volume - 0～1の音量
 * @param {boolean} loop - ループ再生するか
 * @returns {HTMLAudioElement} 生成した音声要素
 */
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

/**
 * 現在選択中の曲を再生する。
 * ブラウザの自動再生制限による失敗は、次のユーザー操作で再試行する。
 * @returns {Promise<void>}
 */
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

/**
 * 再生対象を切り替え、先頭から再生を要求する。
 * @param {HTMLAudioElement} track - 再生する曲
 * @returns {void}
 */
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

/**
 * 画面イベントと、自動再生失敗時の再試行イベントを登録する。
 * @returns {void}
 */
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
