// ============================================================
// シーン・レンダラー初期化
// ============================================================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1e);
scene.fog = new THREE.FogExp2(0x0a0a1e, 0.018);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);

// ============================================================
// 物理エンジン (Cannon.js)
// ============================================================
const world = new CANNON.World();
world.gravity.set(0, -25, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// マテリアル
const groundMat = new CANNON.Material('ground');
const ballMat = new CANNON.Material('ball');
const boxMat = new CANNON.Material('box');

world.addContactMaterial(new CANNON.ContactMaterial(groundMat, ballMat, { friction: 0.5, restitution: 0.2 }));
world.addContactMaterial(new CANNON.ContactMaterial(boxMat, ballMat, { friction: 0.3, restitution: 0.4 }));

// ============================================================
// 地面 (チェッカーボード)
// ============================================================
const FIELD_SIZE = 100;
const TILE_COUNT = 20;
const tileSize = FIELD_SIZE / TILE_COUNT;
const groundGroup = new THREE.Group();
scene.add(groundGroup);

const color1 = new THREE.Color(0x1a2a4a);
const color2 = new THREE.Color(0x0d1a30);
const color3 = new THREE.Color(0x2a1a4a); // 特別色（5x5ごと）

for (let ix = 0; ix < TILE_COUNT; ix++) {
    for (let iz = 0; iz < TILE_COUNT; iz++) {
        const geo = new THREE.PlaneGeometry(tileSize - 0.05, tileSize - 0.05);
        let col;
        const region = Math.floor(ix / 5) + Math.floor(iz / 5);
        if (region % 3 === 2) col = color3;
        else col = (ix + iz) % 2 === 0 ? color1 : color2;

        const mat = new THREE.MeshLambertMaterial({ color: col });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(
            (ix - TILE_COUNT / 2 + 0.5) * tileSize,
            0,
            (iz - TILE_COUNT / 2 + 0.5) * tileSize
        );
        mesh.receiveShadow = true;
        groundGroup.add(mesh);
    }
}

// グリッド線
const gridHelper = new THREE.GridHelper(FIELD_SIZE, TILE_COUNT, 0x334466, 0x223355);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

// 物理地面
const groundBody = new CANNON.Body({ mass: 0, material: groundMat });
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(groundBody);

// 壁
function addWall(x, y, z, sx, sy, sz) {
    const b = new CANNON.Body({ mass: 0 });
    b.addShape(new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2)));
    b.position.set(x, y, z);
    world.addBody(b);
}
const W = FIELD_SIZE / 2, H = 5;
addWall(W, H / 2, 0, 1, H * 2, FIELD_SIZE);
addWall(-W, H / 2, 0, 1, H * 2, FIELD_SIZE);
addWall(0, H / 2, W, FIELD_SIZE, H * 2, 1);
addWall(0, H / 2, -W, FIELD_SIZE, H * 2, 1);

// ============================================================
// ボール
// ============================================================
const BALL_R = 0.6;
const ballGeo = new THREE.SphereGeometry(BALL_R, 32, 32);
const ballMesh_mat = new THREE.MeshPhongMaterial({
    color: 0xff6633,
    emissive: 0x441100,
    shininess: 100,
    specular: 0xffffff
});
const ballMesh = new THREE.Mesh(ballGeo, ballMesh_mat);
ballMesh.castShadow = true;
scene.add(ballMesh);

// ボール内のライン（転がり可視化）
const lineGeo = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(BALL_R * 0.8));
const lineMat = new THREE.LineBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.4 });
const ballLines = new THREE.LineSegments(lineGeo, lineMat);
ballMesh.add(ballLines);

// 物理ボール
const ballBody = new CANNON.Body({ mass: 1.5, material: ballMat });
ballBody.addShape(new CANNON.Sphere(BALL_R));
ballBody.position.set(0, BALL_R + 1, 0);
ballBody.linearDamping = 0.3;
ballBody.angularDamping = 0.1;
world.addBody(ballBody);

// ボールのグロー効果（点光源）
const ballLight = new THREE.PointLight(0xff7744, 1.5, 6);
scene.add(ballLight);

// ============================================================
// 障害物キューブ
// ============================================================
const obstacles = [];
let hitCount = 0;
const cubeColors = [0x4488ff, 0x44ffaa, 0xff44aa, 0xffcc44, 0xaa44ff, 0x44ccff];

function createCube(x, z, w, h, d, colorIdx) {
    const col = cubeColors[colorIdx % cubeColors.length];
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshPhongMaterial({
        color: col,
        emissive: new THREE.Color(col).multiplyScalar(0.15),
        shininess: 60
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(x, h / 2, z);
    scene.add(mesh);

    // エッジ
    const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: new THREE.Color(col).addScalar(0.3) })
    );
    mesh.add(edges);

    const body = new CANNON.Body({ mass: 0, material: boxMat });
    body.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)));
    body.position.set(x, h / 2, z);
    world.addBody(body);

    obstacles.push({ mesh, body, originalColor: col, mat });
}

// 障害物配置（ランダム + 構造的）
const obstacleDefs = [
    // 迷路風の壁
    [-20, -10, 12, 2, 1], [-10, -10, 12, 2, 1], [0, -10, 12, 2, 1],
    [20, 15, 1, 3, 12], [-20, 15, 1, 3, 12],
    [10, 5, 3, 4, 3], [-10, 5, 3, 4, 3],
    [0, 20, 8, 1.5, 1], [0, -20, 8, 1.5, 1],
    // 散らばったキューブ
    [15, -15, 2, 2, 2], [-15, 15, 2, 2, 2],
    [25, 0, 3, 3, 3], [-25, 5, 2, 2.5, 2],
    [5, 30, 1.5, 4, 1.5], [-5, -30, 1.5, 4, 1.5],
    [30, -20, 2, 1.5, 2], [-30, 20, 2, 1.5, 2],
    [10, -25, 4, 1, 4], [-10, 25, 4, 1, 4],
    [35, 10, 1.5, 5, 1.5], [-35, -10, 1.5, 5, 1.5],
    [20, 30, 2, 2, 2], [-20, -30, 2, 2, 2],
];

obstacleDefs.forEach((def, i) => {
    createCube(def[0], def[1], def[2], def[3], def[4], i);
});

// 衝突検出
ballBody.addEventListener('collide', (e) => {
    const isObstacle = obstacles.some(o => o.body === e.body);
    if (isObstacle) {
        hitCount++;
        document.getElementById('hits').textContent = hitCount;
        // ヒットエフェクト
        const obs = obstacles.find(o => o.body === e.body);
        if (obs) {
            obs.mat.emissive.setHex(0x884400);
            setTimeout(() => obs.mat.emissive.setHex(new THREE.Color(obs.originalColor).multiplyScalar(0.15).getHex()), 200);
        }
    }
});

// ============================================================
// 照明
// ============================================================
const ambientLight = new THREE.AmbientLight(0x223355, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xaaccff, 1.2);
dirLight.position.set(20, 40, 20);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 150;
dirLight.shadow.camera.left = -60;
dirLight.shadow.camera.right = 60;
dirLight.shadow.camera.top = 60;
dirLight.shadow.camera.bottom = -60;
scene.add(dirLight);

// ネオン床ライト
const neonLight1 = new THREE.PointLight(0x0044ff, 2, 30);
neonLight1.position.set(-20, 0.5, -20);
scene.add(neonLight1);

const neonLight2 = new THREE.PointLight(0xff0088, 2, 30);
neonLight2.position.set(20, 0.5, 20);
scene.add(neonLight2);

// ============================================================
// パーティクル（星）
// ============================================================
const starGeo = new THREE.BufferGeometry();
const starVerts = [];
for (let i = 0; i < 500; i++) {
    starVerts.push((Math.random() - 0.5) * 200, Math.random() * 50 + 5, (Math.random() - 0.5) * 200);
}
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.6 });
scene.add(new THREE.Points(starGeo, starMat));

// ============================================================
// ジャイロ / 加速度・キーボード入力
// ============================================================
let gyroAlpha = 0, gyroBeta = 0, gyroGamma = 0;
let gyroEnabled = false;
const keys = {};

// 共通ジャンプ処理関数
function triggerJump() {
    // 二重ジャンプ防止（一定の高さ以下ならジャンプ可能）
    if (ballBody.position.y < 2.0) {
        const JUMP_FORCE = 25; // ジャンプの強さ
        ballBody.velocity.y = JUMP_FORCE; // 瞬間的に上向きの速度を設定
    }
}

// キーボード入力
document.addEventListener('keydown', e => {
    keys[e.code] = true;
    // スペースキーが押された瞬間にジャンプ
    if (e.code === 'Space') {
        triggerJump();
    }
    // Rキーでリセット
    if (e.code === 'KeyR') {
        resetBall();
    }
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

// スマホかどうか判定
const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

function requestGyro() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ の場合はユーザーの許可が必要
        DeviceOrientationEvent.requestPermission()
            .then(perm => {
                if (perm === 'granted') {
                    enableGyro();
                    enableMotion(); // 加速度センサーも有効化
                }
            })
            .catch(console.error);
    } else if (isMobile) {
        // Android等のスマホ
        enableGyro();
        enableMotion();
    }
}

// 傾き（ジャイロ）の監視
function enableGyro() {
    window.addEventListener('deviceorientation', (e) => {
        if (e.beta !== null && e.gamma !== null) {
            gyroAlpha = e.alpha || 0;
            gyroBeta = e.beta || 0;
            gyroGamma = e.gamma || 0;
            gyroEnabled = true;
            document.getElementById('gyro-indicator').textContent =
                `ジャイロ: β${gyroBeta.toFixed(1)}° γ${gyroGamma.toFixed(1)}°`;
        }
    }, true);
}

// ★新規追加：加速度（モーション）の監視（デバイスの振り上げ検知）
function enableMotion() {
    let lastJumpTime = 0; // 連続ジャンプ制限用のタイマー

    window.addEventListener('devicemotion', (e) => {
        if (!e.acceleration) return;

        // 重力を除いた3軸のリアルタイム加速度を取得
        const ax = e.acceleration.x || 0;
        const ay = e.acceleration.y || 0;
        const az = e.acceleration.z || 0;

        // デバイスが受けた衝撃の総質量（合成加速度）を計算
        const totalAcceleration = Math.sqrt(ax * ax + ay * ay + az * az);

        // 判定用の閾値（18前後は、スマホを「クイックにシュッと上へ振る」強さです）
        const ACCEL_THRESHOLD = 18;
        const now = performance.now();

        // 閾値を超え、かつ前回のジャンプから300ミリ秒以上経過している場合
        if (totalAcceleration > ACCEL_THRESHOLD && (now - lastJumpTime > 300)) {
            triggerJump();
            lastJumpTime = now; // タイマー更新
        }
    }, true);
}

// ============================================================
// リセット
// ============================================================
function resetBall() {
    ballBody.position.set(0, BALL_R + 1, 0);
    ballBody.velocity.set(0, 0, 0);
    ballBody.angularVelocity.set(0, 0, 0);
    ballBody.quaternion.set(0, 0, 0, 1);
}

// ============================================================
// カメラ追従
// ============================================================
const camOffset = new THREE.Vector3(0, 8, 14);
const camTarget = new THREE.Vector3();

// ============================================================
// メインループ
// ============================================================
const FORCE_SCALE = 22;
let lastTime = performance.now();
let started = false;
let totalDist = 0;
const prevPos = new THREE.Vector3();

function animate() {
    requestAnimationFrame(animate);
    if (!started) return;

    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // キーボード入力（PC用 / 常に処理）
    let fx = 0, fz = 0;
    if (keys['ArrowUp'] || keys['KeyW']) fz -= FORCE_SCALE;
    if (keys['ArrowDown'] || keys['KeyS']) fz += FORCE_SCALE;
    if (keys['ArrowLeft'] || keys['KeyA']) fx -= FORCE_SCALE;
    if (keys['ArrowRight'] || keys['KeyD']) fx += FORCE_SCALE;

    // ジャイロ入力（スマホ用 / キーボードに加算）
    if (gyroEnabled) {
        const gamma = Math.max(-45, Math.min(45, gyroGamma)); // 左右傾き
        const beta = Math.max(-45, Math.min(45, gyroBeta));  // 前後傾き
        fx += (gamma / 45) * FORCE_SCALE;
        fz += (beta / 45) * FORCE_SCALE;
    }

    if (fx !== 0 || fz !== 0) {
        // 作用点をボール重心（ワールド座標）に指定してトルク発生を防ぐ
        const bp = ballBody.position;
        ballBody.applyForce(
            new CANNON.Vec3(fx, 0, fz),
            new CANNON.Vec3(bp.x, bp.y, bp.z)
        );
    }

    // 最大速度制限
    const maxV = 15;
    const vel = ballBody.velocity;
    if (vel.length() > maxV) {
        vel.scale(maxV / vel.length(), vel);
    }

    world.step(1 / 60, dt, 3);

    // Three.js 同期
    ballMesh.position.copy(ballBody.position);
    ballMesh.quaternion.copy(ballBody.quaternion);

    // 距離計算
    const bp = ballMesh.position;
    const moved = bp.distanceTo(prevPos);
    if (moved > 0.01) {
        totalDist += moved;
        prevPos.copy(bp);
        document.getElementById('dist').textContent = totalDist.toFixed(1);
    }

    // ボールライト
    ballLight.position.copy(ballMesh.position);
    ballLight.position.y += 0.5;

    // カメラ追従（スムーズ）
    camTarget.lerp(ballMesh.position, 0.08);
    camera.position.lerp(
        new THREE.Vector3(
            camTarget.x + camOffset.x,
            camTarget.y + camOffset.y,
            camTarget.z + camOffset.z
        ), 0.07
    );
    camera.lookAt(camTarget);

    // ネオンライト回転
    const t = now / 1000;
    neonLight1.position.x = Math.sin(t * 0.3) * 25;
    neonLight1.position.z = Math.cos(t * 0.3) * 25;
    neonLight2.position.x = Math.cos(t * 0.4) * 25;
    neonLight2.position.z = Math.sin(t * 0.4) * 25;

    renderer.render(scene, camera);
}

// ============================================================
// スタートボタン
// ============================================================
document.getElementById('start-btn').addEventListener('click', async () => { // ★ async を追加
    // 画面を横向きに固定（失敗してもゲームが進むように try-catch にする）
    if (typeof screen.orientation !== 'undefined' && typeof screen.orientation.lock === 'function') {
        try {
            // フルスクリーン要求(これをしないと画面固定が聞かない模様(android Chrome))
            await document.documentElement.requestFullscreen();
            await screen.orientation.lock('landscape-primary');
            console.log("横画面に固定しました");
        } catch (error) {
            console.warn("画面固定に失敗:", error);
        }
    }

    requestGyro();
    document.getElementById('start-overlay').style.display = 'none';
    prevPos.copy(new THREE.Vector3(0, BALL_R, 0));
    lastTime = performance.now();
    started = true;
    animate();
});

// ウィンドウリサイズ
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 初回レンダリング（スタート前）
camera.position.set(0, 8, 14);
camera.lookAt(0, 0, 0);
renderer.render(scene, camera);