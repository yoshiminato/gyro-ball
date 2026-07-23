let pausedAt = null;
let totalPausedDuration = 0;

export function getGameTime() {
    const currentTime = pausedAt ?? performance.now();
    return currentTime - totalPausedDuration;
}

export function pauseGameClock() {
    if (pausedAt !== null) return;
    pausedAt = performance.now();
}

export function resumeGameClock() {
    if (pausedAt === null) return;
    totalPausedDuration += performance.now() - pausedAt;
    pausedAt = null;
}

export function resetGameClock() {
    pausedAt = null;
    totalPausedDuration = 0;
}
