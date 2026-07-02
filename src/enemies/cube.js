import { Enemy } from './enemy.js';
import { createCubeBody } from '../core/physics.js';
import { createCubeMesh } from '../core/renderer.js';

export class Cube extends Enemy{
    static id = 0;
    static MASS = 2.0;
    constructor(x, z, w, h, d) {
        super(x, z);
        this.w = w;
        this.h = h;
        this.d = d;
        this.id = Cube.id++;
        this.body = createCubeBody(x, z, w, h, d, this.id, Cube.MASS);
        this.mesh = createCubeMesh(x, z, w, h, d, this.id);
    }

    generateMesh() {
        const geometry = new THREE.BoxGeometry(this.w, this.h, this.d);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(this.x, this.h / 2, this.y);
        return mesh;
    }

    chase(characterX, characterZ) {

        const cp = this.body.position;
        const dx = characterX - cp.x;
        const dz = characterZ - cp.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        // const speed = 0.5; // 追跡速度
        
        // this.body.applyForce(new CANNON.Vec3(dx * speed, 0, dz * speed), new CANNON.Vec3(cp.x, cp.y, cp.z));
        const speed = 50;

        const euler = new CANNON.Vec3();
this.body.quaternion.toEuler(euler);
        this.body.applyForce(new CANNON.Vec3(dx / distance * speed, 0, dz / distance * speed), new CANNON.Vec3(cp.x, cp.y, cp.z));
        this.body.quaternion.setFromEuler(
    0,          // Roll
    euler.y,    // Yawだけ保持
    0           // Pitch
);

    }


}