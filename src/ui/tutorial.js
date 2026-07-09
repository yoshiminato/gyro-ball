export function showTutorialOverlay(imgSrc, text) {

    const overlay = document.createElement('div');
    overlay.classList.add('tutorial-overlay');

    const img = document.createElement('img');
    img.src = imgSrc;
    overlay.appendChild(img);

    const p = document.createElement('p');
    p.textContent = text;
    overlay.appendChild(p);

    document.body.appendChild(overlay);

}