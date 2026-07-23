window.addEventListener('game-over', deleteHpBar);
window.addEventListener('game-clear', deleteHpBar);
window.addEventListener('tutorial-exit', deleteHpBar);
window.addEventListener('back-to-mode-select', deleteHpBar);

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

export function updateHpBar(hp) {
    const hpBar = document.getElementById('hp-bar');
    if (hpBar) hpBar.style.width = `${hp}%`;
}


export function deleteHpBar() {
    const hpBarContainer = document.getElementById('hp-bar-container');
    if (hpBarContainer) document.body.removeChild(hpBarContainer);
}
