let currentBall = null;
let registered = false;

export function registerTouchEvent(ball) {
    currentBall = ball;
    if (registered) return;

    registered = true;
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
}

function handleTouchStart() {
    currentBall?.triggerJump();
}
