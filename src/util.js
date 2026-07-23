// 動作端末いがモバイルかどうかを判定
export function isMobileDevice() {

  const ua = navigator.userAgent.toLowerCase();
  
  // iPhone, iPad, Android などのキーワードが含まれているかチェック
  return /iphone|ipad|ipod|android/.test(ua);
}


// 全画面 & 横画面
export async function setupGameScreen(e){
    if (typeof document.documentElement.requestFullscreen === 'function') {
        try {
            // 画面を全画面にする
            await document.documentElement.requestFullscreen();
        } catch (error) {
            // 全画面表示を拒否・非対応でも、ゲーム自体は開始できるようにする
            console.warn("全画面表示に失敗:", error);
        }
    }

    if (
        isMobileDevice()
        && typeof screen.orientation?.lock === 'function'
    ) {
        try {
            // 対応端末では横画面に固定する
            await screen.orientation.lock('landscape-primary');
        } catch (error) {
            // 画面固定を拒否・非対応でも、ゲーム自体は開始できるようにする
            console.warn("画面固定に失敗:", error);
        }
    }

    // 全画面表示や画面固定の成否にかかわらず、モード選択へ進む
    const gameStartEvent = new CustomEvent('title-exit');
    window.dispatchEvent(gameStartEvent);
}


// 列挙型の値からキーを取得する
export function getEnumKey(enumObject, value) {
    const numberValue = Number(value);

    return Object.keys(enumObject).find(
        key => enumObject[key] === numberValue
    ) ?? 'UNKNOWN';
}
