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

/**
 * ボタンなどのUI操作を除き、ゲーム画面へのタッチをジャンプとして扱う。
 * @param {TouchEvent} event - タッチ開始イベント
 */
function handleTouchStart(event) {
    const target = event.target;
    if (
        target instanceof Element
        && target.closest(
            'button, a, input, select, textarea, [role="button"], [data-no-jump]'
        )
    ) return;

    currentBall?.triggerJump();
}
