// 動作端末いがモバイルかどうかを判定
export function isMobileDevice() {

  const ua = navigator.userAgent.toLowerCase();
  
  // iPhone, iPad, Android などのキーワードが含まれているかチェック
  return /iphone|ipad|ipod|android/.test(ua);
}


