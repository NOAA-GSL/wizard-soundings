/**
 * Represents a 2D vector with u and v components.
 */

/**
 * Calculates magnitude (speed) and direction from u/v components.
 * @param {number} u - The horizontal component of the vector.
 * @param {number} v - The vertical component of the vector.
 * @returns {Array<number>} An array containing [magnitude, direction].
 */
export const comp2vec = (u, v) => {
    let wdir = (180 / Math.PI) * Math.atan2(-u, -v);
    const wdsp = Math.sqrt(u ** 2 + v ** 2);
    if (wdir < 0) {
        wdir += 360;
    }
    return [wdsp, wdir];
};

/**
 * Calculates u and v components from magnitude and direction.
 * @param {number} mag - The magnitude (speed) of the vector.
 * @param {number} drx - The direction in degrees (meteorological convention).
 * @returns {Array<number>} An array containing the u and v components: [u, v].
 */
export const vec2comp = (mag, drx) => {
    // Convert direction from degrees to radians for trigonometric functions
    const drxRad = drx * (Math.PI / 180);

    // Calculate u and v components using meteorological conventions
    const u = -mag * Math.sin(drxRad);
    const v = -mag * Math.cos(drxRad);

    return [u, v];
};

/**
 * Checks if an object is a Vector created by the factory.
 * @param {object} obj - The object to check.
 * @returns {boolean}
 */
export const isVector = (obj) => obj && obj.type === 'Vector';

/**
 * Creates a new Vector object.
 * @param {number} u - The horizontal component of the vector.
 * @param {number} v - The vertical component of the vector.
 * @returns {object} A vector object with u, v, mag, drx, update(), and toString().
 */

export const createVector = (u, v) => {
    const [initialMag, initialDrx] = comp2vec(u, v);

    return {
        type: 'Vector',
        u,
        v,
        mag: initialMag,
        drx: initialDrx,

        /**
         * Updates the vector with new u and v components.
         * @param {number} newU - The new horizontal component.
         * @param {number} newV - The new vertical component.
         */
        update(newU, newV) {
            this.u = newU;
            this.v = newV;
            [this.mag, this.drx] = comp2vec(newU, newV);
        },

        /**
         * Displays the vector's properties in a readable format.
         * @returns {string} A string representation of the vector.
         */
        toString() {
            return `Vector(u=${this.u}, v=${this.v})`;
        },
    };
};
