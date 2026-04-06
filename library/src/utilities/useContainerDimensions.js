import { useState, useCallback, useLayoutEffect } from 'react';

const useContainerDimensions = () => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [node, setNode] = useState(null);

    // 1. Ref Callback: triggers update only when the DOM node actually changes
    const ref = useCallback((element) => {
        setNode(element);
    }, []);

    // 2. LayoutEffect: Sync measurement to prevent visual jumps
    useLayoutEffect(() => {
        let observer;

        if (node) {
            observer = new ResizeObserver((entries) => {
                window.requestAnimationFrame(() => {
                    if (Array.isArray(entries) && entries.length > 0) {
                        const { width, height } = entries[0].contentRect;
                        setDimensions({ width, height });
                    }
                });
            });

            observer.observe(node);
        }

        return () => {
            if (observer) {
                observer.disconnect();
            }
        };
    }, [node]);

    return [ref, dimensions];
};

export default useContainerDimensions;
