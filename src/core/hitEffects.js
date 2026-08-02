import { camera, scene } from './renderer.js';

const effects = [];
const flashes = new Map();
const previousShakeOffset = new THREE.Vector3();
let shakeStrength = 0;
let shakeTime = 0;
let shakeDuration = 0;

const sparkGeometry = new THREE.SphereGeometry(0.075, 6, 6);

function getContactPoint(event, enemyBody) {
    const contact = event.contact;
    const relativePoint = contact.bi === enemyBody ? contact.ri : contact.rj;
    return new THREE.Vector3(
        enemyBody.position.x + relativePoint.x,
        enemyBody.position.y + relativePoint.y,
        enemyBody.position.z + relativePoint.z
    );
}

function flashMesh(mesh, isWeakPoint) {
    if (!mesh) return;

    let state = flashes.get(mesh);
    if (!state) {
        const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
        state = {
            materials,
            originals: materials.map(material => ({
                emissive: material.emissive?.clone(),
                emissiveIntensity: material.emissiveIntensity
            })),
            remaining: 0
        };
        flashes.set(mesh, state);
    }

    state.remaining = Math.max(state.remaining, isWeakPoint ? 0.16 : 0.09);
    state.materials.forEach(material => {
        if (!material.emissive) return;
        material.emissive.setHex(0xffffff);
        material.emissiveIntensity = isWeakPoint ? 2.8 : 1.8;
    });
}

function restoreFlash(mesh, state) {
    state.materials.forEach((material, index) => {
        const original = state.originals[index];
        if (!material.emissive || !original.emissive) return;
        material.emissive.copy(original.emissive);
        material.emissiveIntensity = original.emissiveIntensity;
    });
    flashes.delete(mesh);
}

function createSparks(position, isWeakPoint, impactSpeed) {
    const count = isWeakPoint ? 22 : 12;
    const color = isWeakPoint ? 0xfff4a3 : 0xff8a33;
    const group = new THREE.Group();
    const particles = [];

    for (let i = 0; i < count; i++) {
        const material = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const spark = new THREE.Mesh(sparkGeometry, material);
        spark.position.copy(position);
        const velocity = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() * 0.8 + 0.15,
            Math.random() - 0.5
        ).normalize().multiplyScalar(
            (isWeakPoint ? 8 : 5) + Math.min(impactSpeed, 15) * 0.18
        );
        group.add(spark);
        particles.push({ mesh: spark, velocity });
    }

    scene.add(group);
    effects.push({ type: 'sparks', group, particles, age: 0, lifetime: isWeakPoint ? 0.42 : 0.3 });
}

function createShockwave(position, isWeakPoint) {
    const ringCount = isWeakPoint ? 2 : 1;
    for (let i = 0; i < ringCount; i++) {
        const material = new THREE.MeshBasicMaterial({
            color: isWeakPoint ? 0xfff6b0 : 0xff7040,
            transparent: true,
            opacity: isWeakPoint ? 0.95 : 0.7,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.72, 1, 32),
            material
        );
        ring.position.copy(position);
        ring.scale.setScalar(0.15 + i * 0.12);
        scene.add(ring);
        effects.push({
            type: 'ring',
            mesh: ring,
            age: -i * 0.055,
            lifetime: isWeakPoint ? 0.34 : 0.25,
            maxScale: isWeakPoint ? 3.6 : 2.2
        });
    }
}

/** 命中地点にエフェクトを生成し、対象を短時間発光させる。 */
export function spawnHitEffect(event, enemyBody, enemyMesh, isWeakPoint, impactSpeed) {
    if (!scene || !enemyBody) return;
    const position = getContactPoint(event, enemyBody);
    createSparks(position, isWeakPoint, impactSpeed);
    createShockwave(position, isWeakPoint);
    flashMesh(enemyMesh, isWeakPoint);

    const strength = isWeakPoint ? 0.34 : 0.14;
    shakeStrength = Math.max(shakeStrength, strength + Math.min(impactSpeed, 15) * 0.006);
    shakeDuration = isWeakPoint ? 0.2 : 0.12;
    shakeTime = shakeDuration;
}

/** 前フレームでカメラへ足した揺れを除去する。 */
export function beginCameraFrame(activeCamera) {
    activeCamera.position.sub(previousShakeOffset);
    previousShakeOffset.set(0, 0, 0);
}

/** カメラの通常追従後に、そのフレーム分の揺れを加える。 */
export function applyCameraShake(activeCamera) {
    if (shakeTime <= 0) return;
    const amount = shakeStrength * (shakeTime / shakeDuration);
    previousShakeOffset.set(
        (Math.random() - 0.5) * 2 * amount,
        (Math.random() - 0.5) * amount,
        (Math.random() - 0.5) * 2 * amount
    );
    activeCamera.position.add(previousShakeOffset);
}

/** 生成済みの短命エフェクトを1フレーム進める。 */
export function updateHitEffects(dt) {
    shakeTime = Math.max(0, shakeTime - dt);

    for (const [mesh, state] of flashes) {
        state.remaining -= dt;
        if (state.remaining <= 0) restoreFlash(mesh, state);
    }

    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        effect.age += dt;
        if (effect.age < 0) continue;

        const progress = Math.min(effect.age / effect.lifetime, 1);
        if (effect.type === 'sparks') {
            effect.particles.forEach(particle => {
                particle.velocity.y -= 12 * dt;
                particle.mesh.position.addScaledVector(particle.velocity, dt);
                particle.mesh.material.opacity = 1 - progress;
                particle.mesh.scale.setScalar(1 - progress * 0.65);
            });
        } else {
            effect.mesh.lookAt(camera.position);
            effect.mesh.scale.setScalar(0.15 + effect.maxScale * progress);
            effect.mesh.material.opacity = (1 - progress) * 0.85;
        }

        if (progress < 1) continue;
        if (effect.type === 'sparks') {
            scene.remove(effect.group);
            effect.particles.forEach(({ mesh }) => mesh.material.dispose());
        } else {
            scene.remove(effect.mesh);
            effect.mesh.geometry.dispose();
            effect.mesh.material.dispose();
        }
        effects.splice(i, 1);
    }
}

/** ゲームの作り直し前にエフェクト状態とカメラの揺れを破棄する。 */
export function resetHitEffects() {
    for (const [mesh, state] of flashes) restoreFlash(mesh, state);

    effects.forEach(effect => {
        if (effect.type === 'sparks') {
            scene?.remove(effect.group);
            effect.particles.forEach(({ mesh }) => mesh.material.dispose());
        } else {
            scene?.remove(effect.mesh);
            effect.mesh.geometry.dispose();
            effect.mesh.material.dispose();
        }
    });
    effects.length = 0;
    shakeStrength = 0;
    shakeTime = 0;
    shakeDuration = 0;
    previousShakeOffset.set(0, 0, 0);
}
