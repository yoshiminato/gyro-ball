// 動作端末いがモバイルかどうかを判定
export function isMobileDevice() {

  const ua = navigator.userAgent.toLowerCase();
  
  // iPhone, iPad, Android などのキーワードが含まれているかチェック
  return /iphone|ipad|ipod|android/.test(ua);
}

// 全画面 & 横画面
export async function setupGameScreen(e){

    if (typeof screen.orientation !== 'undefined' && typeof screen.orientation.lock === 'function') {
        try {
            // 画面を全画面にする
            await document.documentElement.requestFullscreen();

            // 画面を横画面に固定する
            if (isMobileDevice()) 
                await screen.orientation.lock('landscape-primary');

            // ゲーム開始イベントを発火
            const gameStartEvent = new CustomEvent('title-exit');
            window.dispatchEvent(gameStartEvent);
        } catch (error) {
            console.warn("画面固定に失敗:", error);
        }
    }
}
