import Plot from 'react-plotly.js';
import { useAppSelector } from './app/hooks';
import { selectConfusionsMap } from './app/similaritiesSlice';
import { ConfusionTopK, PLotlyDataLayout } from './types';

function getConfusionMatrixData(
    topk: number,
    confusion: ConfusionTopK | undefined
): PLotlyDataLayout {
    if (!confusion)
        return {
            data: [],
            layout: {
                height: 320,
                width: 380,
                title: `Confusion Matrix: TOP ${topk}`
            }
        };

    const { fp, tn, tp, fn } = confusion;

    return {
        data: [
            {
                type: 'heatmap',
                x: ['Alarm', 'Not alarm'],
                y: ['Not alarm', 'Alarm'],
                z: [
                    [fp, tn],
                    [tp, fn]
                ]
            }
        ],
        layout: {
            height: 320,
            width: 380,
            title: `Confusion Matrix: TOP ${topk}`,
            annotations: [fp, tn, tp, fn].map((v, i) => ({
                x: i % 2,
                y: Math.floor(i / 2),
                text: v.toFixed(),
                font: { color: 'white', size: 26 },
                showarrow: false
            }))
        }
    };
}

export default function ConfusionMatrices() {
    const confusionsMap = useAppSelector(selectConfusionsMap);

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    gap: '35px',
                    justifyContent: 'center'
                }}
            >
                {Object.entries(confusionsMap)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([topk, confusion], i) => (
                        <Plot
                            key={i}
                            {...getConfusionMatrixData(Number(topk), confusion)}
                        />
                    ))}
            </div>
        </>
    );
}
