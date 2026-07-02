export function registerTouchEvent(ball) {
    document.addEventListener("touchstart", () => {
        ball.triggerJump();
    }, { passive: true });
}
