export function registerTouchEvent(ball) {
    console.log("Registering touch event for jump");
    document.addEventListener("touchstart", () => {
        ball.triggerJump();
    }, { passive: true });
}
