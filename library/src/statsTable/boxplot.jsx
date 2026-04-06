import React, { useRef, useMemo } from 'react';
import { math } from '../Utilities';
import BoxWhisker from './BoxWhisker';

const DEFAULT_CONFIG = {
    // Canvas settings
    margin: { top: 20, right: 40, bottom: 30, left: 30 },
    // Percentile settings for box and whiskers
    percentiles: {
        whiskers: [5, 95], // Percentiles for whiskers
        boxes: [25, 75], // Percentiles for boxes
    },
};

function ordinal_suffix_of(i) {
    const j = i % 10;
    const k = i % 100;
    if (j == 1 && k != 11) {
        return `${i}st`;
    }
    if (j == 2 && k != 12) {
        return `${i}nd`;
    }
    if (j == 3 && k != 13) {
        return `${i}rd`;
    }
    return `${i}th`;
}

export default function BoxPlot({ statsDictParam, curStat, config }) {
    const boxplotDiv = useRef();

    const settings = useMemo(
        () => ({
            ...DEFAULT_CONFIG,
            ...config,
        }),
        [config],
    );

    function boxplot() {
        console.log('BoxPlot statsDictParam:', statsDictParam); // Debugging log
        const data = statsDictParam[curStat];
        console.log('BoxPlot data:', data); // Debugging log
        if (!data) return;

        const layout = {
            id: 'boxplot',
            data: [
                {
                    name: '',
                    whisker1: math.quantile(data, settings.percentiles.whiskers[0] / 100),
                    box1: math.quantile(data, settings.percentiles.boxes[0] / 100),
                    median: math.quantile(data, 0.5),
                    box2: math.quantile(data, settings.percentiles.boxes[1] / 100),
                    whisker2: math.quantile(data, settings.percentiles.whiskers[1] / 100),
                },
            ],
            margin: {
                left: 50, // Left margin
                right: 20, // Right margin
                top: 20, // Top margin
                bottom: 20, // Bottom margin
            },
            width: 1000, //boxplotDiv.current.clientWidth,
            height: 100, // Adjust the height of the plot
        };
        return layout;
    }
    const boxplotLayout = useMemo(() => boxplot(), [statsDictParam, curStat, settings]);

    return (
        <div id="boxWhiskerContainer">
            <div id="boxplot" ref={boxplotDiv} />
            {curStat && (
                <div id="boxwhiskertitle">
                    <div
                        className="linkColor"
                        onClick={() => {
                            dispatch(
                                setSettings({
                                    settingsOpen: true,
                                }),
                            );
                        }}
                    >
                        Box Whiskers:
                    </div>
                    <div>
                        <BoxWhisker
                            data={boxplotLayout.data}
                            width={boxplotLayout.width}
                            height={boxplotLayout.height}
                            margin={boxplotLayout.margin}
                        />
                    </div>
                    <p>
                        {`${ordinal_suffix_of(settings.percentiles.whiskers[0])}, ${ordinal_suffix_of(
                            settings.percentiles.boxes[0],
                        )}, ${ordinal_suffix_of(settings.percentiles.boxes[1])}, & ${ordinal_suffix_of(
                            settings.percentiles.whiskers[1],
                        )}`}
                    </p>
                </div>
            )}
        </div>
    );
}
