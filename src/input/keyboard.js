import { Ball } from '../ball.js';

const keys = {};

const FORCE_COEF = 0.75;

export function registerKeyEvent() {
    document.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'Space') triggerJump();
        if (e.code === 'KeyR') resetBall();
    });
    document.addEventListener('keyup', e => { keys[e.code] = false; });
}

function calculateHeadingFromKeys(ball, dt) {
    if (keys['ArrowLeft'] || keys['KeyA']) ball.heading -= Ball.HEADING_SCALE * dt;
    if (keys['ArrowRight'] || keys['KeyD']) ball.heading += Ball.HEADING_SCALE * dt;
}

export function calculateForceFromKeys(ball, dt) {
    let forwardForce = 0;
    calculateHeadingFromKeys(ball, dt);
    if (keys['ArrowUp'] || keys['KeyW']) forwardForce += Ball.FORCE_SCALE;
    if (keys['ArrowDown'] || keys['KeyS']) forwardForce -= Ball.FORCE_SCALE;
    ball.fx = Math.sin(ball.heading) * forwardForce * FORCE_COEF;
    ball.fz = -Math.cos(ball.heading) * forwardForce * FORCE_COEF;
}