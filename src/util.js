/**
 * User-Agentからジャイロ操作を案内するモバイル端末か判定する。
 * @returns {boolean} iOSまたはAndroid端末ならtrue
 */
export function isMobileDevice() {

  const ua = navigator.userAgent.toLowerCase();
  
  // iPhone, iPad, Android などのキーワードが含まれているかチェック
  return /iphone|ipad|ipod|android/.test(ua);
}


/**
 * 対応端末では全画面・横向きを要求し、成否にかかわらずモード選択へ進む。
 * @returns {Promise<void>}
 */
export async function setupGameScreen() {
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


/**
 * 列挙オブジェクトの数値から表示用キーを逆引きする。
 * @param {Object<string, number>} enumObject - 検索対象の列挙オブジェクト
 * @param {number|string} value - 検索する値
 * @returns {string} 一致したキー。存在しない場合はUNKNOWN
 */
export function getEnumKey(enumObject, value) {
    const numberValue = Number(value);

    return Object.keys(enumObject).find(
        key => enumObject[key] === numberValue
    ) ?? 'UNKNOWN';
}
