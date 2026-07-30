// performance.now()を基準に、ポーズ中の経過だけを差し引く。
let pausedAt = null;
let totalPausedDuration = 0;

/**
 * ポーズ時間を含まないゲーム内時刻をミリ秒で返す。
 * @returns {number} ゲーム内時刻
 */
export function getGameTime() {
    const currentTime = pausedAt ?? performance.now();
    return currentTime - totalPausedDuration;
}

/** ゲーム内時計を停止する。 */
export function pauseGameClock() {
    if (pausedAt !== null) return;
    pausedAt = performance.now();
}

/** 停止していた時間を累積し、ゲーム内時計を再開する。 */
export function resumeGameClock() {
    if (pausedAt === null) return;
    totalPausedDuration += performance.now() - pausedAt;
    pausedAt = null;
}

/** 新しいゲーム用にポーズ情報を初期化する。 */
export function resetGameClock() {
    pausedAt = null;
    totalPausedDuration = 0;
}
