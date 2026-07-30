/**
 * 単一の物理ボディとメッシュを持つ動的オブジェクトの共通処理。
 */
export class DynamicObject {
    
    constructor(){
        this.body = null;
        this.mesh = null;
        this.heading = 0;
    }

    /**
     * 物理ボディの位置と姿勢を描画メッシュへ同期する。
     * @returns {void}
     */
    updateVisuals() {
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }

    /**
     * 指定ボディの重心または指定点へ継続力を加える。
     * @param {CANNON.Vec3} force - 加える力
     * @param {CANNON.Body} body - 対象ボディ
     * @param {CANNON.Vec3|null} point - 力を加えるワールド座標
     * @returns {void}
     */
    applyForce(force, body=this.body, point=null) {
        if(force.x == 0 && force.y == 0 && force.z == 0) return;
        if(!point) point = body.position;
        body.applyForce(force, point);
    }

    /**
     * 指定ボディへ瞬間的な力を加える。
     * @param {CANNON.Vec3} force - 加える力積
     * @param {CANNON.Body} body - 対象ボディ
     * @param {CANNON.Vec3|null} point - 力積を加えるワールド座標
     * @returns {void}
     */
    applyImpulse(force, body=this.body, point=null) {
        if(force.x == 0 && force.y == 0 && force.z == 0) return;
        if(!point) point = body.position;
        body.applyImpulse(force, point);
    }

    /**
     * 追跡処理用に対象の水平座標だけを返す。
     * @param {DynamicObject} target - 追跡対象
     * @returns {{x: number, z: number}} 水平座標
     */
    getTargetPosition(target) {
        const p = target.body.position;
        return {
            x: p.x,
            z: p.z
        };
    }

}
