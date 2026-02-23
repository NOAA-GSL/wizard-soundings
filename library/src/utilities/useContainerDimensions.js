import { useState, useCallback, useLayoutEffect } from 'react';

const useContainerDimensions = () => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [node, setNode] = useState(null);

    // 1. Ref Callback: triggers update only when the DOM node actually changes
    const ref = useCallback((node) => {
        setNode(node);
    }, []);

    // 2. LayoutEffect: Sync measurement to prevent visual jumps
    useLayoutEffect(() => {
        if (!node) return;

        const observer = new ResizeObserver((entries) => {
            // Wrapping in requestAnimationFrame avoids "ResizeObserver loop limit exceeded" errors
            window.requestAnimationFrame(() => {
                if (!Array.isArray(entries) || !entries.length) return;
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            });
        });

        observer.observe(node);

        return () => observer.disconnect();
    }, [node]);

    return [ref, dimensions];
};

export default useContainerDimensions;
