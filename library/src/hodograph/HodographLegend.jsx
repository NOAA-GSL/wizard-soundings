import React from 'react';
import styles from './hodograph.module.css';

export const DEFAULT_HODOGRAPH_SEGMENTS = [
    { maxHeight: 1000, color: 'red', label: '0-1 km' },
    { maxHeight: 3000, color: 'orange', label: '1-3 km' },
    { maxHeight: 6000, color: 'purple', label: '3-6 km' },
    { maxHeight: Infinity, color: 'blue', label: '>6 km' },
];

/* Component: HodographLegend
    Color key for the hodograph mean-wind segments. Rendered inside Hodograph by default,
    or standalone anywhere (pass the same `segments` used by the Hodograph).
*/
export default function HodographLegend({
    segments = DEFAULT_HODOGRAPH_SEGMENTS,
    title = 'Mean Wind',
    className = '',
    sx = {},
}) {
    return (
        <div
            className={[styles.legend, 'ws-hodograph-legend', className].filter(Boolean).join(' ')}
            style={sx}
        >
            {title && <strong className={styles.legendTitle}>{title}</strong>}
            {segments.map((item) => (
                <div className={styles.legendItem} key={item.label}>
                    <span
                        className={styles.legendColorBox}
                        style={{ backgroundColor: item.color }}
                    />
                    <span>{item.label}</span>
                </div>
            ))}
        </div>
    );
}
