export class DynamicObject {
    
    constructor(){
        this.body = null;
        this.mesh = null;
        this.heading = 0;
    }

    updateVisuals(newHeading) {
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }

    applyForce(force, object=this, point=null) {
        if(force.x == 0 && force.z == 0) return;
        if(!point) point = object.body.position;
        object.body.applyForce(force, point);
    }

    applyImpulse(force, object=this, point=null) {
        if(force.x == 0 && force.z == 0) return;
        if(!point) point = object.body.position;
        object.body.applyImpulse(force, point);
    }

    getTargetPosition(target) {
        const p = target.body.position;
        return {
            x: p.x,
            z: p.z
        };
    }

}