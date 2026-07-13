export class DynamicObject {
    
    constructor(){
        this.body = null;
        this.mesh = null;
        this.heading = 0;
        this.fx = 0;
        this.fz = 0;
    }

    updateVisuals(newHeading) {
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }

    applyForce() {
        const fx = this.fx;
        const fz = this.fz;
        if (fx !== 0 || fz !== 0) {
            const bp = this.body.position;
            this.body.applyForce(new CANNON.Vec3(fx, 0, fz), new CANNON.Vec3(bp.x, bp.y, bp.z));
        }  
    }

    getTargetPosition(target) {
        const p = target.body.position;
        return {
            x: p.x,
            z: p.z
        };
    }

}