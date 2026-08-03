// ============================================================
// renderer.js - Three.js 描画・視覚効果担当
// ============================================================

import { FIELD_RADIUS } from '../constants.js';

export let renderer = null;
export let scene = null;
export let camera = null;
export let ballLight = null;
export let neonLight1 = null;
export let neonLight2 = null;

let resizeListenerRegistered = false;

const cubeColor = 0x4488ff;

/**
 * Three.jsのレンダラー、シーン、カメラ、背景要素を生成する。
 * @returns {void}
 */
export function initRenderer() {
    // レンダラー初期化
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: 'high-performance'
    
    });
    
    renderer.setPixelRatio(1);

    // renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1e);
    scene.fog = new THREE.FogExp2(0x0a0a1e, 0.018);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 8, 14);
    camera.lookAt(0, 0, 0);

    createGround();
    createLights();
    createStars();
    
    // リサイズイベントの登録
    if (!resizeListenerRegistered) {
        window.addEventListener('resize', onWindowResize);
        resizeListenerRegistered = true;
    }
}

function createGround() {
    const groundGroup = new THREE.Group();
    scene.add(groundGroup);

    // 円形フィールド本体
    const groundGeometry = new THREE.CircleGeometry(FIELD_RADIUS, 128);
    const groundMaterial = new THREE.MeshLambertMaterial({
        color: 0x101d38,
        side: THREE.DoubleSide
    });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    groundGroup.add(groundMesh);

    // 円形グリッドでフィールド内部の距離と方向を見やすくする
    const polarGrid = new THREE.PolarGridHelper(
        FIELD_RADIUS,
        24,
        10,
        128,
        0x365b8c,
        0x223855
    );
    polarGrid.position.y = 0.02;
    groundGroup.add(polarGrid);

    // 明るいリングを物理壁と同じ位置に置き、境界を明示する
    const boundaryGeometry = new THREE.TorusGeometry(
        FIELD_RADIUS,
        0.2,
        8,
        128
    );
    const boundaryMaterial = new THREE.MeshBasicMaterial({
        color: 0x33ccff,
        transparent: true,
        opacity: 0.95
    });
    const boundaryMesh = new THREE.Mesh(
        boundaryGeometry,
        boundaryMaterial
    );
    boundaryMesh.rotation.x = Math.PI / 2;
    boundaryMesh.position.y = 0.12;
    groundGroup.add(boundaryMesh);
}

/**
 * プレイヤーボールと追従ライトを生成する。
 * @param {number} radius - ボール半径
 * @returns {THREE.Mesh} 生成したボールメッシュ
 */
export function createBallMesh(radius) {
    const ballGeo = new THREE.SphereGeometry(radius, 32, 32);
    const ballMesh_mat = new THREE.MeshPhongMaterial({
        color: 0xff6633,
        emissive: 0x441100,
        shininess: 100,
        specular: 0xffffff
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMesh_mat);
    ballMesh.castShadow = true;
    scene.add(ballMesh);

    const lineGeo = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(radius * 0.8));
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.4 });
    const ballLines = new THREE.LineSegments(lineGeo, lineMat);
    ballMesh.add(ballLines);

    ballLight = new THREE.PointLight(0xff7744, 1.5, 6);
    scene.add(ballLight);
    return ballMesh;
}


/**
 * 進行面と弱点面を色分けしたCubeメッシュを生成する。
 * @param {number} x - 初期X座標
 * @param {number} z - 初期Z座標
 * @param {number} w - 幅
 * @param {number} h - 高さ
 * @param {number} d - 奥行き
 * @param {number} headFace - 危険面のマテリアル番号
 * @param {number} weakFace - 弱点面のマテリアル番号
 * @returns {THREE.Mesh} 生成したCubeメッシュ
 */
export function createCubeMesh(
    x,
    z,
    w,
    h,
    d,
    headFace = 4,
    weakFace = 5
) {

    const col = cubeColor;
    const geometry = new THREE.BoxGeometry(w, h, d);

    const materials = [];

    for (let i = 0; i < 6; i++) {

        let faceColor = col;

        // 前面（進行方向）
        if (i === headFace) {
            faceColor = 0xff0000;
        }

        // 弱点（前面より優先）
        if (i === weakFace) {
            faceColor = 0xfff4a3;   // 薄い黄色
        }

        materials.push(
            new THREE.MeshPhongMaterial({
                color: faceColor,
                emissive: new THREE.Color(faceColor).multiplyScalar(0.2),
                shininess: 80
            })
        );
    }

    const mesh = new THREE.Mesh(geometry, materials);

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(x, h / 2, z);

    scene.add(mesh);

    // エッジは白にする
    const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({
            color: 0xffffff
        })
    );

    mesh.add(edges);

    return mesh;
}

/**
 * Snakeの各物理セグメントに対応する球メッシュを生成する。
 * @param {number} x - 頭の初期X座標
 * @param {number} z - 頭の初期Z座標
 * @param {number} radius - 頭の半径
 * @param {number} count - セグメント数
 * @param {number} weakSegmentIndex - 弱点セグメント番号
 * @returns {THREE.Mesh[]} 生成したメッシュ一覧
 */
export function createSnakeMesh(x, z, radius, count, weakSegmentIndex) {

    const meshes = [];

    for (let i = 0; i < count; i++) {

        const r = radius * Math.pow(0.9, i);

        const isHead = i === 0;
        const isWeakSegment = i === weakSegmentIndex;

        const material = new THREE.MeshPhongMaterial({
            color: isWeakSegment ? 0xffd54f : 0x222222,
            emissive: isWeakSegment
                ? 0xff8f00
                : (isHead ? 0xaa0000 : 0x330000),
            emissiveIntensity: isWeakSegment ? 1.5 : 1,
            shininess: isWeakSegment ? 180 : 120
        });

        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(r, 24, 24),
            material
        );

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add(mesh);

        if (i === 0) {

            // 白目
            const eyeGeo = new THREE.SphereGeometry(r * 0.18, 16, 16);
            const eyeMat = new THREE.MeshPhongMaterial({ color: 0x000000});
 
            const leftEye = new THREE.Mesh(eyeGeo, eyeMat);  
            leftEye.position.set(-r * 0.28, r * 0.12, r * 0.82);

            const rightEye = leftEye.clone();
            rightEye.position.x = r * 0.28;

            mesh.add(leftEye);
            mesh.add(rightEye);

            // 瞳
            const pupilGeo = new THREE.SphereGeometry(r * 0.07, 12, 12);
            const pupilMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

            const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
            leftPupil.position.set(0, 0, r * 0.12);
            leftEye.add(leftPupil);

            const rightPupil = leftPupil.clone();
            rightEye.add(rightPupil);

            // 口
            const mouthGeo = new THREE.TorusGeometry(
                r * 0.18,
                r * 0.025,
                8,
                24,
                Math.PI
            );
        
            const mouthMat = new THREE.MeshBasicMaterial({
                color: 0x000000,
            });
        
            const mouth = new THREE.Mesh(mouthGeo, mouthMat);
        
            mouth.rotation.z = Math.PI;
            mouth.position.set(0, -r * 0.18, r * 1.02);
        
            mesh.add(mouth);
        }

        meshes.push(mesh);
    }

    return meshes;
}

function createLights() {
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

    neonLight1 = new THREE.PointLight(0x0044ff, 2, 30);
    neonLight1.position.set(-20, 0.5, -20);
    scene.add(neonLight1);

    neonLight2 = new THREE.PointLight(0xff0088, 2, 30);
    neonLight2.position.set(20, 0.5, 20);
    scene.add(neonLight2);
}

function createStars() {
    const starGeo = new THREE.BufferGeometry();
    const starVerts = [];
    for (let i = 0; i < 500; i++) {
        starVerts.push((Math.random() - 0.5) * 200, Math.random() * 50 + 5, (Math.random() - 0.5) * 200);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Points(starGeo, starMat));
}


// 光線のメッシュの作成
export function createLightRayMesh(radius = 0.12) {
    // 高さ1、中心が原点の円柱
    const geometry = new THREE.CylinderGeometry(
        radius,
        radius,
        1,
        12
    );

    const material = new THREE.MeshBasicMaterial({
        color: 0xff2222,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;

    scene.add(mesh);

    return mesh;
}

/**
 * ウィンドウサイズに描画領域とカメラ比率を合わせる。
 * @returns {void}
 */
function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * GPUリソース、Canvas、リサイズイベントを破棄する。
 * @returns {void}
 */
export function destroyRenderer() {
    if (resizeListenerRegistered) {
        window.removeEventListener('resize', onWindowResize);
        resizeListenerRegistered = false;
    }

    if (scene) {
        scene.traverse((object) => {
            object.geometry?.dispose?.();

            if (Array.isArray(object.material)) {
                object.material.forEach((material) => material.dispose?.());
            } else {
                object.material?.dispose?.();
            }
        });

        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
    }

    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement?.remove();
    }

    renderer = null;
    scene = null;
    camera = null;
    ballLight = null;
    neonLight1 = null;
    neonLight2 = null;
}
