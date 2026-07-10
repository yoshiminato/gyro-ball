import { DynamicObject } from "./dynamicObject";

class Enemy extends DynamicObject {

    constructor(maxHp) {
        super();
        this.maxHp = maxHp;
    }
} 