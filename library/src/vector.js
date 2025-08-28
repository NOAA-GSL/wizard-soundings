/**
 * Represents a 2D vector with u and v components.
 */
export default class Vector {
    /**
     * Creates a new Vector object.
     * @param {number} u - The horizontal component of the vector.
     * @param {number} v - The vertical component of the vector.
     */
    constructor(u, v) {
        this.update(u, v);
    }

    update(u, v) {
        this.u = u;
        this.v = v;
        [this.mag, this.drx] = Vector.comp2vec(u, v);
    }

    // Calculate wind vector from components
    static comp2vec(u, v) {
        let wdir = (180 / Math.PI) * Math.atan2(-u, -v);
        const wdsp = Math.sqrt(u ** 2 + v ** 2);
        if (wdir < 0) {
            wdir += 360;
        }
        return [wdsp, wdir];
    }

    /**
     * Calculates u and v components from magnitude and direction.
     * @param {number} mag - The magnitude (speed) of the vector.
     * @param {number} drx - The direction in degrees (meteorological convention).
     * @returns {Array<number>} An array containing the u and v components: [u, v].
     */
    static vec2comp(mag, drx) {
        // Convert direction from degrees to radians for trigonometric functions
        const drxRad = drx * (Math.PI / 180);

        // Calculate u and v components using meteorological conventions
        const u = -mag * Math.sin(drxRad);
        const v = -mag * Math.cos(drxRad);

        return [u, v];
    }

    /**
     * Displays the vector's properties in a readable format.
     * @returns {string} A string representation of the vector.
     */
    toString() {
        return `Vector(u=${this.u}, v=${this.v})`;
    }
}
