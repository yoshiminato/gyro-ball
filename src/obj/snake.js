import { DynamicObject } from "./dynamicObject.js";
import { createSnakeBody } from "../core/physics.js";
import { createSnakeMesh } from "../core/renderer.js";

export class Snake extends DynamicObject {

    static id = 0;
    static MASS = 2;
    static FORCE_SCALE = 60;

    constructor(x, z) {

        super();

        this.radius = 2;
        this.segmentCount = 7;
        this.id = Snake.id++;

        const snake = createSnakeBody(
            x,
            z,
            this.radius,
            this.segmentCount,
            Snake.MASS
        );

        this.bodies = snake.bodies;
        this.constraints = snake.constraints;

        this.meshes = createSnakeMesh(
            x,
            z,
            this.radius,
            this.segmentCount
        );
    }

    chase(targetX, targetZ) {

        const head = this.bodies[0];

        const p = head.position;

        const dx = targetX - p.x;
        const dz = targetZ - p.z;

        const distance = Math.hypot(dx, dz);

        if (distance < 0.001) return;

        head.applyForce(
            new CANNON.Vec3(
                dx / distance * Snake.FORCE_SCALE,
                0,
                dz / distance * Snake.FORCE_SCALE
            ),
            p
        );

        // 顔を進行方向へ向ける
        this.faceYaw = Math.atan2(dx, dz);
    }

    updateVisuals() {

        for (let i = 0; i < this.bodies.length; i++) {

            this.meshes[i].position.copy(
                this.bodies[i].position
            );

            if(i == 0) {
                this.meshes[i].rotation.set(0, this.faceYaw, 0); 
                continue;
            }
            this.meshes[i].quaternion.copy(
                this.bodies[i].quaternion
            );

        }


    }

}