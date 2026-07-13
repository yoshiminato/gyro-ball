import { DynamicObject } from "./dynamicObject.js";
import { createSnakeBody } from "../core/physics.js";
import { createSnakeMesh } from "../core/renderer.js";

export class Snake extends DynamicObject {

    static id = 0;
    static MASS = 2;
    static FORCE_SCALE = 60;
    static JUMP_INTERVAL = 5000;
    static JUMP_FORCE = 60;

    static initialPosition = { x: 0, z: -6 };

    constructor(difficulty) {

        super();
        const { x, z } = Snake.initialPosition;

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

        this.nextJumpTime = performance.now() + Snake.JUMP_INTERVAL;
    }

    update(ball){
        // 物理演算
        const targetPos = this.getTargetPosition(ball);
        this.chase(targetPos.x, targetPos.z);
        // ビジュアル更新
        this.updateVisuals();
    }

    chase(targetX, targetZ) {

        const head = this.bodies[0];

        const p = head.position;

        const dx = targetX - p.x;
        const dz = targetZ - p.z;

        const distance = Math.hypot(dx, dz);

        const fx = dx / distance * Snake.FORCE_SCALE;
        const fz = dz / distance * Snake.FORCE_SCALE;

        head.applyForce(
            new CANNON.Vec3(
                fx,
                0,
                fz
            ),
            p
        );

        if (performance.now() > this.nextJumpTime) {
            head.applyImpulse(
                new CANNON.Vec3(fx, Snake.JUMP_FORCE, fz),
                p
            );
            this.nextJumpTime += Snake.JUMP_INTERVAL;
        }

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