import { useState, useRef, useCallback } from 'react';
import * as d3 from 'd3';

/**
 * Custom hook to bridge D3 Zoom behavior with React state.
 * @param {Object} dimensions - { width, height } of the container.
 * @param {Object} zoomConfig - { enabled, extent } or { min, max }.
 * @returns {Array} [zoomRefCallback, transformState]
 */
function useZoomHandler(dimensions, zoomConfig) {
    const [transformState, setTransformState] = useState({ k: 1, x: 0, y: 0 });
    const transformRef = useRef({ k: 1, x: 0, y: 0 });

    const zoomRefCallback = useCallback(
        (node) => {
            if (!node || dimensions.width === 0) return;

            const selection = d3.select(node);
            const { enabled } = zoomConfig;

            // Handle different config keys between your SkewT and Hodograph
            const scaleExtent = [zoomConfig.min || 1, zoomConfig.max || 10];

            if (!enabled) {
                selection.on('.zoom', null);
                return;
            }

            const zoom = d3
                .zoom()
                .scaleExtent(scaleExtent)
                .translateExtent([
                    [0, 0],
                    [dimensions.width, dimensions.height],
                ])
                .on('zoom', (event) => {
                    const { k, x, y } = event.transform;

                    // Only update React state if the transform actually changed.
                    if (
                        k !== transformRef.current.k ||
                        x !== transformRef.current.x ||
                        y !== transformRef.current.y
                    ) {
                        transformRef.current = { k, x, y };
                        setTransformState({ k, x, y });
                    }
                });

            selection.call(zoom);

            // Restore previous transform so re-renders don't reset the view
            const currentT = d3.zoomTransform(node);
            const { k, x, y } = transformRef.current;

            if (k !== currentT.k || x !== currentT.x || y !== currentT.y) {
                selection.call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(k));
            }
        },
        [dimensions, zoomConfig],
    );

    return [zoomRefCallback, transformState];
}

export default useZoomHandler;
