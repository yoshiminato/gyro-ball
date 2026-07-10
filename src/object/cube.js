import { Opponent, Difficulty } from '../constants.js';
import { createCubeBody } from '../core/physics.js';
import { createCubeMesh } from '../core/renderer.js';
import { DynamicObject } from './dynamicObject.js';
import { showHpBar, updateHpBar } from '../ui/hpBar.js';
import { destroyGame } from '../gameController.js';


export class Cube extends DynamicObject {
    static id = 0;
    static MASS = 2.0;
    static FORCE_SCALE = 50.0;
    static TURN_SPEED = 0.005;
    static WEAK_FACE_DAMAGE_COEF = 3.0;

    static FACE = {
        RIGHT: 0,
        LEFT: 1,
        TOP: 2,
        BOTTOM: 3,
        FRONT: 4,
        BACK: 5,
        NONE: -1
    };

    static initialPosition = { x: 0, z: -6, h: 3, w: 3, d: 3 };

    constructor(difficulty) {
        const { x, z, h, w, d } = Cube.initialPosition;
        super();
        this.yaw = 0;
        this.id = Cube.id++;
        this.difficulty = difficulty;
        this.body = createCubeBody(x, z, w, h, d, this.id, Cube.MASS);
        this.mesh = createCubeMesh(x, z, w, h, d, this.id, Cube.FACE.FRONT, Cube.FACE.BACK);

        this.weakFace = Cube.FACE.BACK;
        this.headFace = Cube.FACE.FRONT;

        console.log(`difficulty in cube constructor: ${difficulty}`);
        console.log(`compare value: ${Difficulty.EASY}`);

        switch (Number(difficulty)) {
            case Difficulty.EASY:
                this.maxHp = 30;
                break;
            case Difficulty.NORMAL:
                this.maxHp = 50;
                break;
            case Difficulty.HARD:
                this.maxHp = 100;
                break;
            default:
                console.log("default")
                this.maxHp = 100;
        }

        this.hp = this.maxHp;

        showHpBar();

        this.body.addEventListener('collide', (e) => this.hundleDamageEvent(e));
    }

    hundleDamageEvent(event) {

        // 衝突イベントからダメージを計算
        const damage = this.calculateDamage(event);

        // ダメージがない場合は処理を終了
        if(!damage) return;
        console.log(`Damage received: ${damage}, maxHp: ${this.maxHp}, currentHp: ${this.hp}`);

        // ダメージ適用
        this.applyDamage(damage);
        const restHpRate = this.hp / this.maxHp;
        updateHpBar(restHpRate * 100);

    }

    calculateDamage(event) {

        if (event.body.name !== 'ball') return null;

        // 衝突面の法線ベクトル方向の速度を取得
        const impactSpeed = event.contact.getImpactVelocityAlongNormal();
        const worldNormal = event.contact.ni;
        const inv = this.body.quaternion.inverse();
        const localNormal = inv.vmult(worldNormal);
    
        // z前後(マイナス：前面、プラス：背面)
        // x左右(マイナス：右面、プラス：左面)
        // y上下(マイナス：下面、プラス：上面) 
        // cubeの正面に衝突した場合
        if(localNormal.z < - 0.1){
            // ゲームオーバー
            const gameOverEvent = new CustomEvent('game-over', {
                detail: { opponent: Opponent.CUBE, difficulty: this.difficulty }
            });
            console.log('Game Over! Cube hit on the front face.');
            window.dispatchEvent(gameOverEvent);
            try{
                destroyGame();
            } catch (err) {
                console.error('Error occurred while destroying game:', err);
            }
            return null;
        }

        switch (this.weakFace) {
            case Cube.FACE.BACK:
                if (localNormal.z > 0.1) return Cube.WEAK_FACE_DAMAGE_COEF * impactSpeed;
                else return impactSpeed;
        
            case Cube.FACE.LEFT:
                if (localNormal.x > 0.1) return Cube.WEAK_FACE_DAMAGE_COEF * impactSpeed;
                else return impactSpeed;
            
            case Cube.FACE.RIGHT:
                if (localNormal.x < -0.1) return Cube.WEAK_FACE_DAMAGE_COEF * impactSpeed;
                else return impactSpeed;
          
            case Cube.FACE.TOP:
                if (localNormal.y > 0.1) return Cube.WEAK_FACE_DAMAGE_COEF * impactSpeed;
                else return impactSpeed;
            
            default:
                return impactSpeed;
        }
    }

    // ダメージ反映
    applyDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.hp = 0;
            // cubeの破壊処理? & 勝利イベント
            const gameClearEvent = new CustomEvent('game-clear');
            window.dispatchEvent(gameClearEvent);
            console.log('Victory! Cube destroyed.');
        }
    }

    // キャラクターの追跡
    chase(characterX, characterZ) {

        const cp = this.body.position;
        const dx = characterX - cp.x;
        const dz = characterZ - cp.z;

        const targetYaw = Math.atan2(dx, dz);
        const error = Math.atan2(
            Math.sin(targetYaw - this.yaw),
            Math.cos(targetYaw - this.yaw)
        );
        this.yaw += error * Cube.TURN_SPEED;

        this.body.quaternion.setFromEuler(
            0,
            this.yaw,
            0
        );

        const distance = Math.sqrt(dx * dx + dz * dz);
        
        this.fx = Math.sin(this.yaw) * Cube.FORCE_SCALE;
        this.fz = Math.cos(this.yaw) * Cube.FORCE_SCALE;

        this.applyForce();
        // this.keepAtitude();
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


    updateWeakFace(newWeakFace) {

        const normalColor = cubeColors[this.id % cubeColors.length];

        for (let i = 0; i < 6; i++) {

            let color = normalColor;

            if (i === this.headFace) {
                color = 0xff0000;
            }

            if (i === this.weakFace) {
                color = 0xfff4a3;
            }

            this.mesh.material[i].color.setHex(color);
            this.mesh.material[i].emissive.set(
                new THREE.Color(color).multiplyScalar(0.2)
            );
        }
    }


}