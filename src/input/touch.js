// リトライ時はイベントを増やさず、操作対象だけを差し替える。
let currentBall = null;
let registered = false;

/**
 * 操作対象を更新し、タッチイベントを初回だけ登録する。
 * @param {Ball} ball - 現在操作するボール
 * @returns {void}
 */
export function registerTouchEvent(ball) {
    currentBall = ball;
    if (registered) return;

    registered = true;
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
}

/** 画面へのタッチをジャンプ入力として現在のボールへ渡す。 */
function handleTouchStart() {
    currentBall?.triggerJump();
}
