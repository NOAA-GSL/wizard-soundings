import { useMemo } from 'react';
import { math } from '../Utilities';
import BoxWhisker from './boxWhisker';
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

function ordinalSuffixOf(i) {
    const j = i % 10;
    const k = i % 100;
    if (j === 1 && k !== 11) {
        return `${i}st`;
    }
    if (j === 2 && k !== 12) {
        return `${i}nd`;
    }
    if (j === 3 && k !== 13) {
        return `${i}rd`;
    }
    return `${i}th`;
}

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
        console.log('BoxPlot statsDictParam:', statsDictParam); // Debugging log
        const data = statsDictParam[curStat];
        console.log('BoxPlot data:', data); // Debugging log
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
            <div id="boxwhiskertitle">
                <div
                    className="linkColor"
                    // onClick={() => {
                    //     dispatch(
                    //         setSettings({
                    //             settingsOpen: true,
                    //         }),
                    //     );
                    // }}
                >
                    Box Whiskers:
                </div>

                <p>
                    {`${ordinalSuffixOf(settings.percentiles.whiskers[0])}, ${ordinalSuffixOf(
                        settings.percentiles.boxes[0],
                    )}, ${ordinalSuffixOf(settings.percentiles.boxes[1])}, & ${ordinalSuffixOf(
                        settings.percentiles.whiskers[1],
                    )}`}
                </p>
            </div>
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
