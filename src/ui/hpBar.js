// 勝敗または画面離脱時に、戦闘専用UIを確実に取り除く。
window.addEventListener('game-over', deleteHpBar);
window.addEventListener('game-clear', deleteHpBar);
window.addEventListener('tutorial-exit', deleteHpBar);
window.addEventListener('back-to-mode-select', deleteHpBar);

/**
 * 敵HPバーを重複しないよう生成する。
 * @returns {void}
 */
export function showHpBar() {
    // 画面遷移などで重複生成されることを防ぐ
    if (document.getElementById('hp-bar-container')) return;

    const hpBarContainer = document.createElement('div');
    hpBarContainer.id = 'hp-bar-container';

    const descriptionText = document.createElement('div');
    descriptionText.id = 'hp-label';
    descriptionText.textContent = '相手の残りHP';

    const hpFrame = document.createElement('div');
    hpFrame.id = 'hp-frame';

    const hpBar = document.createElement('div');
    hpBar.id = 'hp-bar';

    hpFrame.appendChild(hpBar);

    hpBarContainer.appendChild(descriptionText);
    hpBarContainer.appendChild(hpFrame);

    document.body.appendChild(hpBarContainer);

}

/**
 * 敵の残りHPをバー幅へ反映する。
 * @param {number} hp - 0～100の残量率
 * @returns {void}
 */
export function updateHpBar(hp) {
    const hpBar = document.getElementById('hp-bar');
    if (hpBar) hpBar.style.width = `${hp}%`;
}


/** 現在表示されている敵HPバーを削除する。 */
export function deleteHpBar() {
    const hpBarContainer = document.getElementById('hp-bar-container');
    if (hpBarContainer) document.body.removeChild(hpBarContainer);
}
