import { Ball } from '../object/ball.js';

const keys = {};

const FORCE_COEF = 0.75;

export function registerKeyEvent(ball) {
    document.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'Space') ball.triggerJump();
        if (e.code === 'KeyR') ball.resetPosition();
    });
    document.addEventListener('keyup', e => { keys[e.code] = false; });
}

function calculateHeadingDeltaFromKeys(dt) {
    if (keys['ArrowLeft'] || keys['KeyA']) return -Ball.HEADING_SCALE * dt;
    if (keys['ArrowRight'] || keys['KeyD']) return Ball.HEADING_SCALE * dt;
    return 0;
}

export function calculateForceFromKeys(ball, dt) {
    let forwardForce = 0;
    ball.heading += calculateHeadingDeltaFromKeys(dt);
    if (keys['ArrowUp'] || keys['KeyW'])   forwardForce =  Ball.FORCE_SCALE;
    if (keys['ArrowDown'] || keys['KeyS']) forwardForce = -Ball.FORCE_SCALE;
    const fx = Math.sin(ball.heading) * forwardForce * FORCE_COEF;
    const fz = -Math.cos(ball.heading) * forwardForce * FORCE_COEF;
    return new CANNON.Vec3(fx, 0, fz);
}