import React from 'react';

/**
 * Renders a standard meteorological wind barb.
 * @param {number} u - Zonal wind component
 * @param {number} v - Meridional wind component
 * @param {number} x - X coordinate in the SVG
 * @param {number} y - Y coordinate in the SVG
 * @param {number} size - Length of the barb staff
 */
function WindBarb({ u, v, x, y, size = 25 }) {
    // Basic calculation for speed and direction
    const speed = Math.sqrt(u * u + v * v);
    // Met direction: from where the wind blows (rads -> deg)
    const dir = Math.atan2(-u, -v) * (180 / Math.PI);
    const rSpeed = Math.round(speed / 5) * 5;

    // Calm wind representation
    if (rSpeed < 5) return <circle cx={x} cy={y} r={2} fill="none" stroke="currentColor" />;

    const flags = Math.floor(rSpeed / 50);
    const pennants = Math.floor((rSpeed - flags * 50) / 10);
    const halfPennants = Math.floor((rSpeed - flags * 50 - pennants * 10) / 5);

    let path = `M0,0 L0,${size} `;
    let pos = size;

    for (let i = 0; i < flags; i++) {
        path += `M0,${pos} L0,${pos - 4} L-10,${pos} Z `;
        pos -= 7;
    }
    for (let i = 0; i < pennants; i++) {
        path += `M0,${pos} L-10,${pos + 4} `;
        pos -= 3;
    }
    for (let i = 0; i < halfPennants; i++) {
        path += `M0,${pos} L-5,${pos + 2} `;
        pos -= 3;
    }

    return (
        <g transform={`translate(${x}, ${y}) rotate(${dir + 180})`}>
            <path d={path} stroke="currentColor" strokeWidth="1.5" fill="none" />
        </g>
    );
}

export default React.memo(WindBarb);
