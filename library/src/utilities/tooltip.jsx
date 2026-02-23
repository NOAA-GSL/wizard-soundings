import React from 'react';

/**
 * Common Tooltip for Meteorological Charts
 * @param {number} x - Horizontal coordinate (px)
 * @param {number} y - Vertical coordinate (px)
 * @param {React.ReactNode} content - The JSX content to display
 * @param {string} positionType - 'fixed' (for tables) or 'absolute' (for SVG groups)
 */
function ChartTooltip({ x, y, content, positionType = 'fixed' }) {
    if (!content) return null;

    const tooltipStyle = {
        position: positionType,
        left: x,
        top: y,
        pointerEvents: 'none', // Prevents tooltip from flickering under the mouse
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: '#fff',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '12px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        transform: 'translate(10px, -15px)', // Offset from cursor
    };

    return (
        <div className="custom-tooltip" style={tooltipStyle}>
            {content}
        </div>
    );
}

export default React.memo(ChartTooltip);
