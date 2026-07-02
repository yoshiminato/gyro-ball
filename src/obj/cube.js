import { createCubeBody } from '../core/physics.js';
import { createCubeMesh } from '../core/renderer.js';
import { DynamicObject } from './dynamicObject.js';


export class Cube extends DynamicObject {
    static id = 0;
    static MASS = 2.0;
    static FORCE_SCALE = 60.0;
    constructor(x, z, w, h, d) {
        super();
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
        
        const normalizedDx = dx / distance;
        const normalizedDz = dz / distance;

        this.fx = normalizedDx * Cube.FORCE_SCALE;
        this.fz = normalizedDz * Cube.FORCE_SCALE;

        this.applyForce();
        this.keepAtitude();
        

    }

    keepAtitude() {
        const euler = new CANNON.Vec3();
        this.body.quaternion.toEuler(euler);
        this.body.quaternion.setFromEuler(
            0,          // Roll
            euler.y,    // Yawだけ保持
            0           // Pitch
        );
    }


}