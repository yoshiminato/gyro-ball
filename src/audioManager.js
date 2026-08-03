// 用途ごとにAudio要素を一度だけ生成し、画面遷移時に再利用する。
const tracks = {
    menu: createTrack('asset/audio/dark_things_loop.mp3', 0.3),
    game: createTrack('asset/audio/fight_looped.wav', 0.28),
    tutorial: createTrack('asset/audio/synthwavehouse.ogg', 0.22),
    gameClear: createTrack('asset/audio/winfretless.ogg', 0.5, false),
    gameOver: createTrack('asset/audio/GameOver.ogg', 0.25, false)
};

const enemyHitSound = createTrack(
    'asset/audio/enemy-hit.ogg',
    0.38,
    false
);

let currentTrack = null;
let playbackRequested = false;
let sfxAudioContext = null;
let sfxMasterGain = null;

function getSfxAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!sfxAudioContext) {
        sfxAudioContext = new AudioContextClass();
        sfxMasterGain = sfxAudioContext.createGain();
        const compressor = sfxAudioContext.createDynamicsCompressor();
        compressor.threshold.value = -12;
        compressor.knee.value = 10;
        compressor.ratio.value = 5;
        compressor.attack.value = 0.002;
        compressor.release.value = 0.12;
        sfxMasterGain.gain.value = 0.72;
        sfxMasterGain.connect(compressor).connect(sfxAudioContext.destination);
    }

    if (sfxAudioContext.state === 'suspended') {
        sfxAudioContext.resume().catch(() => {});
    }
    return sfxAudioContext;
}

function createImpactNoise(context, startAt, isWeakPoint) {
    const duration = isWeakPoint ? 0.18 : 0.13;
    const buffer = context.createBuffer(
        1,
        Math.ceil(context.sampleRate * duration),
        context.sampleRate
    );
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) {
        const decay = Math.pow(1 - i / samples.length, 3);
        samples[i] = (Math.random() * 2 - 1) * decay;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = isWeakPoint ? 1350 : 850;
    filter.Q.value = 0.8;
    gain.gain.setValueAtTime(isWeakPoint ? 0.7 : 0.48, startAt);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    source.connect(filter).connect(gain).connect(sfxMasterGain);
    source.start(startAt);
    source.stop(startAt + duration);
}

function createImpactThump(context, startAt, isWeakPoint) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const duration = isWeakPoint ? 0.24 : 0.17;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(isWeakPoint ? 155 : 120, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(42, startAt + duration);
    gain.gain.setValueAtTime(isWeakPoint ? 0.95 : 0.65, startAt);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    oscillator.connect(gain).connect(sfxMasterGain);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration);
}

function createWeakPointChime(context, startAt) {
    [740, 1110].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = index === 0 ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(frequency, startAt);
        oscillator.frequency.exponentialRampToValueAtTime(
            frequency * 0.72,
            startAt + 0.2
        );
        gain.gain.setValueAtTime(index === 0 ? 0.32 : 0.18, startAt);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.24);
        oscillator.connect(gain).connect(sfxMasterGain);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.24);
    });
}

function playSynthesizedImpact(isWeakPoint) {
    const context = getSfxAudioContext();
    if (!context || !sfxMasterGain) return;
    const startAt = context.currentTime + 0.005;
    createImpactThump(context, startAt, isWeakPoint);
    createImpactNoise(context, startAt, isWeakPoint);
    if (isWeakPoint) createWeakPointChime(context, startAt);
}

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

/**
 * 敵へダメージが入った時の効果音を再生する。
 * 連続攻撃でも前の音を止めないよう、再生ごとにAudio要素を複製する。
 * @param {boolean} isWeakPoint - 弱点への攻撃ならtrue
 * @returns {void}
 */
export function playEnemyHitSfx(isWeakPoint = false) {
    playSynthesizedImpact(isWeakPoint);

    // 元音源は小さく混ぜ、合成した低音と破裂音へ質感を加える。
    const sound = enemyHitSound.cloneNode();
    sound.volume = enemyHitSound.volume;
    sound.playbackRate = isWeakPoint ? 1.08 : 0.86;
    sound.play().catch((error) => {
        if (
            error?.name !== 'NotAllowedError'
            && error?.name !== 'AbortError'
        ) {
            console.warn('攻撃効果音を再生できませんでした', error);
        }
    });
}
