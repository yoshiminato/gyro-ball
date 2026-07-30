// ============================================================
// physics.js - Cannon.js 物理エンジン担当
// ============================================================

import { FIELD_RADIUS } from '../constants.js';

export let world;
let ballBody;

// 円形フィールドを構成する静的壁の設定。
const FIELD_WALL_HEIGHT = 10;
const FIELD_WALL_THICKNESS = 1;
const FIELD_WALL_SEGMENTS = 64;

/**
 * Cannon.jsのワールド、接触材質、地面、外周壁を生成する。
 * @returns {void}
 */
export function initPhysics() {
    world = new CANNON.World();
    world.gravity.set(0, -25, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    // マテリアル
    const groundMat = new CANNON.Material('ground');
    const ballMat = new CANNON.Material('ball');
    const enemyMat = new CANNON.Material('enemy');

    world.addContactMaterial(new CANNON.ContactMaterial(groundMat, ballMat, { friction: 0.7, restitution: 0.2 }));
    world.addContactMaterial(new CANNON.ContactMaterial(enemyMat, groundMat, { friction: 0.4, restitution: 0.3 }));

    // 物理地面
    const groundBody = new CANNON.Body({ mass: 0, material: groundMat });
    groundBody.name = 'ground';
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    // 円周に短い壁を並べ、円形フィールドの境界を作る
    addCircularWall(
        FIELD_RADIUS,
        FIELD_WALL_HEIGHT,
        FIELD_WALL_THICKNESS,
        FIELD_WALL_SEGMENTS
    );
}

/**
 * 円周に直方体の壁を並べて、内側から出られない境界を作る
 * @param {number} radius - フィールド内側の半径
 * @param {number} height - 壁の高さ
 * @param {number} thickness - 壁の厚さ
 * @param {number} segmentCount - 円周を構成する壁の数
 * @returns {void}
 */
function addCircularWall(radius, height, thickness, segmentCount) {
    const angleStep = Math.PI * 2 / segmentCount;
    const segmentLength = 2 * radius * Math.tan(Math.PI / segmentCount);
    const wallCenterRadius = radius + thickness / 2;

    for (let i = 0; i < segmentCount; i++) {
        const angle = i * angleStep;
        const wallBody = new CANNON.Body({ mass: 0 });

        // ローカルX方向を円周の接線方向へ向ける
        wallBody.addShape(new CANNON.Box(new CANNON.Vec3(
            segmentLength / 2,
            height / 2,
            thickness / 2
        )));
        wallBody.position.set(
            Math.cos(angle) * wallCenterRadius,
            height / 2,
            Math.sin(angle) * wallCenterRadius
        );
        wallBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(0, 1, 0),
            -angle - Math.PI / 2
        );
        wallBody.name = 'field-wall';

        world.addBody(wallBody);
    }
}

/**
 * プレイヤーボールの物理ボディを生成する。
 * @param {number} radius - 球の半径
 * @returns {CANNON.Body} 生成したボディ
 */
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


/**
 * Cube敵の直方体ボディを生成する。
 * @param {number} x - 初期X座標
 * @param {number} z - 初期Z座標
 * @param {number} w - 幅
 * @param {number} h - 高さ
 * @param {number} d - 奥行き
 * @param {number} mass - 質量
 * @returns {CANNON.Body} 生成したボディ
 */
export function createCubeBody(x, z, w, h, d, mass = 2) {
    const enemyMat = world.materials.find(m => m.name === 'enemy') || new CANNON.Material('enemy');
    const body = new CANNON.Body({ mass: mass, material: enemyMat });
    body.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)));
    body.position.set(x, h / 2, z);
    world.addBody(body);
    return body;
}

/**
 * 大きさの異なる球を距離拘束でつないだSnakeの物理ボディを生成する。
 * @param {number} x - 頭の初期X座標
 * @param {number} z - 頭の初期Z座標
 * @param {number} radius - 頭の半径
 * @param {number} count - セグメント数
 * @returns {{bodies: CANNON.Body[], constraints: CANNON.Constraint[]}}
 */
export function createSnakeBody(
    x,
    z,
    radius,
    count
) {

    const bodies = [];
    const constraints = [];
    const radii = [];

    const enemyMat = world.materials.find(m => m.name === 'enemy') || new CANNON.Material('enemy');

    for (let i = 0; i < count; i++) {

        // 頭が一番大きく、尻尾ほど小さい
        const r = radius * Math.pow(0.9, i);
        radii.push(r);

        const mass = (i === 0) ? 2 : 0.5;

        const body = new CANNON.Body({
            mass,
            linearDamping: 0.2,
            angularDamping: 0.95,
            material: enemyMat
        });

        body.addShape(new CANNON.Sphere(r));

        if (i === 0) {
            body.position.set(x, r, z);
        } else {
            const prevR = radii[i - 1];
            const spacing = (prevR + r) * 0.95;

            body.position.set(
                x,
                r,
                bodies[i - 1].position.z - spacing
            );
        }

        world.addBody(body);
        bodies.push(body);

        if (i > 0) {

            const prevR = radii[i - 1];
            const spacing = (prevR + r) * 0.95;

            const c = new CANNON.DistanceConstraint(
                bodies[i - 1],
                body,
                spacing,
                1e6
            );

            world.addConstraint(c);
            constraints.push(c);
        }
    }

    return {
        bodies,
        constraints
    };
}

/**
 * 現在の物理ワールドに属するボディと拘束をすべて破棄する。
 * @returns {void}
 */
export function destroyPhysics() {
    // 物理世界の全てのボディを削除
    while (world.bodies.length > 0) {
        world.removeBody(world.bodies[0]);
    }
    while (world.constraints.length) {
        world.removeConstraint(world.constraints[0]);
    }
}
