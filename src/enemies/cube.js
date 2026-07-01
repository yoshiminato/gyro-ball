import Enemy from './enemy.js';

export class Cube extends Enemy{
    constructor(x, y, w, h, d, id) {
        super(x, y);
        this.w = w;
        this.h = h;
        this.d = d;
        this.id = id;
    }

    generateMesh() {
        const geometry = new THREE.BoxGeometry(this.w, this.h, this.d);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(this.x, this.h / 2, this.y);
        return mesh;
    }

    chase(characterX, characterY) {
        const dx = characterX - this.x;
        const dy = characterY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = 0.05; // 追跡速度

    }
}