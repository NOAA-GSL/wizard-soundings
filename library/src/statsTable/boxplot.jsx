import { useMemo } from 'react';
import { math } from '../Utilities';
import BoxWhisker from './BoxWhisker';
import useContainerDimensions from '../utilities/useContainerDimensions';

const DEFAULT_CONFIG = {
    // Canvas settings
    margin: { top: 20, right: 40, bottom: 30, left: 30 },
    // Percentile settings for box and whiskers
    percentiles: {
        whiskers: [5, 95], // Percentiles for whiskers
        boxes: [25, 75], // Percentiles for boxes
    },
    orientation: 'horizontal', // 'horizontal' or 'vertical'
    height: null, // Default height for horizontal. You might want this taller for vertical!
};

export default function BoxPlot({ statsDictParam, curStat, config }) {
    const [containerRef, dimensions] = useContainerDimensions();

    const settings = useMemo(
        () => ({
            ...DEFAULT_CONFIG,
            ...config,
        }),
        [config],
    );

    // 2. Compute dynamic height based on orientation
    const isVertical = settings.orientation === 'vertical';
    // If a height is provided in config, use it. Otherwise, auto-switch based on orientation.
    const plotHeight = settings.height || (isVertical ? 400 : 120);

    const plotData = useMemo(() => {
        const data = statsDictParam[curStat];
        if (!data) return null;

        return [
            {
                name: curStat,
                whisker1: math.quantile(data, settings.percentiles.whiskers[0] / 100),
                box1: math.quantile(data, settings.percentiles.boxes[0] / 100),
                median: math.quantile(data, 0.5),
                box2: math.quantile(data, settings.percentiles.boxes[1] / 100),
                whisker2: math.quantile(data, settings.percentiles.whiskers[1] / 100),
            },
        ];
    }, [statsDictParam, curStat, settings]);

    if (!plotData) return null;

    return (
        <div
            id="boxWhiskerContainer"
            style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
        >
            <div
                id="boxplot"
                ref={containerRef}
                style={{ width: '100%', height: plotHeight, position: 'relative' }}
            >
                {/* Only render the chart once we have a real width > 0 */}
                {dimensions.width > 0 && (
                    <div style={{ position: 'absolute', inset: 0 }}>
                        <BoxWhisker
                            data={plotData}
                            width={dimensions.width}
                            height={plotHeight}
                            margin={settings.margin}
                            orientation={settings.orientation}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
