/**
 * User-Agentからジャイロ操作を案内するモバイル端末か判定する。
 * @returns {boolean} iOSまたはAndroid端末ならtrue
 */
export function isMobileDevice() {

  const ua = navigator.userAgent.toLowerCase();
  
  // iPhone, iPad, Android などのキーワードが含まれているかチェック
  return /iphone|ipad|ipod|android/.test(ua);
}

let orientationLockBlocked = false;

/** 現在このドキュメントが全画面表示されているかを返す。 */
export function isGameFullscreen() {
    return Boolean(
        document.fullscreenElement
        || document.webkitFullscreenElement
    );
}

/** このブラウザで全画面要求を利用できるかを返す。 */
export function isFullscreenSupported() {
    const element = document.documentElement;
    return Boolean(
        element.requestFullscreen
        || element.webkitRequestFullscreen
    );
}

/**
 * ユーザー操作を起点に全画面表示を要求し、可能なら横向き固定も試みる。
 * @returns {Promise<boolean>} 全画面表示になった場合はtrue
 */
export async function requestGameFullscreen() {
    const element = document.documentElement;
    const requestFullscreen =
        element.requestFullscreen
        || element.webkitRequestFullscreen;

    if (!isGameFullscreen() && requestFullscreen) {
        try {
            await requestFullscreen.call(element);
        } catch (error) {
            console.warn('全画面表示に失敗:', error);
            return false;
        }
    }

    if (
        isMobileDevice()
        && !orientationLockBlocked
        && typeof screen.orientation?.lock === 'function'
    ) {
        try {
            await screen.orientation.lock('landscape-primary');
        } catch (error) {
            if (error?.name === 'SecurityError') {
                orientationLockBlocked = true;
            }
            console.warn('画面固定に失敗:', error);
        }
    }

    return isGameFullscreen();
}


/**
 * 対応端末では全画面・横向きを要求し、成否にかかわらずモード選択へ進む。
 * @returns {Promise<void>}
 */
export async function setupGameScreen() {
    await requestGameFullscreen();

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
