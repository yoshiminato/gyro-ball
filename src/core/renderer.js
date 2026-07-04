// ============================================================
// renderer.js - Three.js 描画・視覚効果担当
// ============================================================

export let renderer, scene, camera;
export let ballMesh, ballLight, neonLight1, neonLight2;
export const obstacles = []; // 描画用メッシュとマテリアルの保持

const FIELD_SIZE = 100;
const TILE_COUNT = 20;
const tileSize = FIELD_SIZE / TILE_COUNT;
const cubeColors = [0x4488ff, 0x44ffaa, 0xff44aa, 0xffcc44, 0xaa44ff, 0x44ccff];

export function initRenderer() {
    // レンダラー初期化
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
    window.addEventListener('resize', onWindowResize);
}

function createGround() {
    const groundGroup = new THREE.Group();
    scene.add(groundGroup);

    const color1 = new THREE.Color(0x1a2a4a);
    const color2 = new THREE.Color(0x0d1a30);
    const color3 = new THREE.Color(0x2a1a4a);

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

    const gridHelper = new THREE.GridHelper(FIELD_SIZE, TILE_COUNT, 0x334466, 0x223355);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);
}

export function createBallMesh(radius) {
    const ballGeo = new THREE.SphereGeometry(radius, 32, 32);
    const ballMesh_mat = new THREE.MeshPhongMaterial({
        color: 0xff6633,
        emissive: 0x441100,
        shininess: 100,
        specular: 0xffffff
    });
    ballMesh = new THREE.Mesh(ballGeo, ballMesh_mat);
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

export function createCubeMesh(x, z, w, h, d, colorIdx, bodyId) {
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

    const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: new THREE.Color(col).addScalar(0.3) })
    );
    mesh.add(edges);

    // 物理ボディと紐づけるためにオブジェクトとして配列に保存
    obstacles.push({ mesh, bodyId, originalColor: col, mat });
    return mesh;
}

export function createSnakeMesh(x, z, radius, count) {

    const meshes = [];

    for (let i = 0; i < count; i++) {

        const r = radius * Math.pow(0.9, i);

        const material = new THREE.MeshPhongMaterial({
            color: 0x222222,
            emissive: i === 0 ? 0xaa0000 : 0x330000,
            shininess: 120
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

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}