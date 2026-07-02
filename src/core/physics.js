// ============================================================
// physics.js - Cannon.js 物理エンジン担当
// ============================================================

export let world, ballBody;
export const obstacleBodies = []; // main.jsや衝突判定で参照用
let hitCount = 0;

const FIELD_SIZE = 50//100;

export function initPhysics(obstaclesFromRenderer) {
    world = new CANNON.World();
    world.gravity.set(0, -25, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    // マテリアル
    const groundMat = new CANNON.Material('ground');
    const ballMat = new CANNON.Material('ball');
    const boxMat = new CANNON.Material('box');

    world.addContactMaterial(new CANNON.ContactMaterial(groundMat, ballMat, { friction: 0.7, restitution: 0.2 }));
    world.addContactMaterial(new CANNON.ContactMaterial(boxMat, ballMat, { friction: 0.3, restitution: 0.4 }));

    // 物理地面
    const groundBody = new CANNON.Body({ mass: 0, material: groundMat });
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    // 外周の壁
    const W = FIELD_SIZE / 2, H = 5;
    addWall(W, H / 2, 0, 1, H * 2, FIELD_SIZE);
    addWall(-W, H / 2, 0, 1, H * 2, FIELD_SIZE);
    addWall(0, H / 2, W, FIELD_SIZE, H * 2, 1);
    addWall(0, H / 2, -W, FIELD_SIZE, H * 2, 1);
}

function addWall(x, y, z, sx, sy, sz) {
    const b = new CANNON.Body({ mass: 0 });
    b.addShape(new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2)));
    b.position.set(x, y, z);
    world.addBody(b);
}

export function createBallBody(radius) {
    const ballMat = world.materials.find(m => m.name === 'ball') || new CANNON.Material('ball');
    ballBody = new CANNON.Body({ mass: 1.5, material: ballMat });
    ballBody.addShape(new CANNON.Sphere(radius));
    ballBody.position.set(0, radius + 1, 0);
    ballBody.linearDamping = 0.3;
    ballBody.angularDamping = 0.1;
    world.addBody(ballBody);
    return ballBody;
}


export function createCubeBody(x, z, w, h, d, id, mass = 2, boxMat) {
    console.log(`Creating cube body at (${x}, ${z}) with dimensions (${w}, ${h}, ${d}) and mass ${mass}`);
    const body = new CANNON.Body({ mass: mass, material: boxMat });
    body.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)));
    body.position.set(x, h / 2, z);
    body.id = id; // メッシュと紐づけるための固有ID
    world.addBody(body);
    obstacleBodies.push(body);
    return body;
}

export function setupCollisionHandler(rendererObstacles, boxMat) {
    ballBody.addEventListener('collide', (e) => {
        // 衝突した相手が障害物ボディの配列に含まれているか
        const isObstacle = obstacleBodies.some(b => b === e.body);
        if (isObstacle) {
            hitCount++;
            // document.getElementById('hits').textContent = hitCount;

            // renderer側のエフェクト対象をIDで探す
            const obs = rendererObstacles.find(o => o.bodyId === e.body.id);
            if (obs) {
                obs.mat.emissive.setHex(0x884400);
                setTimeout(() => {
                    obs.mat.emissive.setHex(new THREE.Color(obs.originalColor).multiplyScalar(0.15).getHex());
                }, 200);
            }
        }
    });
}