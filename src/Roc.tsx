import Plot from "react-plotly.js";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { RocResponse, fetchRoc, selectRoc } from "./app/rocSlice";
import { selectSelectedModelVariation } from "./app/optionsSlice";
import { selectTexts } from "./app/textsSlice";
import { useEffect } from "react";
import { linearizeTextClassification } from "./utils";

function transform({fpr, tpr, thresholds, auc}: RocResponse): Plotly.Data[] {
    return [
        // the curve
        {
            x: fpr,
            y: tpr,
            mode: 'lines',
            line: {
                color: 'darkorange',
                width: 2
            },
            hovertext: thresholds.map((t) => t.toFixed(4)),
            showlegend: false
        },
        // the random line
        {
            x: [0, 1],
            y: [0, 1],
            mode: 'lines',
            line: {
                color: 'navy',
                width: 2,
                dash: 'dash'
            },
            showlegend: false
        }
    ];
}

export default function Roc() {
    const dispatch = useAppDispatch();

    const {loading, data} = useAppSelector(selectRoc);

    const modelVariation = useAppSelector(selectSelectedModelVariation);
    const texts = useAppSelector(selectTexts);

    useEffect(() => {
        if (texts && texts.length > 0 && modelVariation) {
            dispatch(
                fetchRoc({
                    texts: linearizeTextClassification(texts),
                    modelVariation
                })
            );
        }
    }, [texts, modelVariation, dispatch]);

    return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            {loading || !data
                ? <></>
                : <Plot
                        data={transform(data)}
                        layout={{
                            height: 380,
                            width: 380,
                            title: `ROC - AUC: ${data.auc.toFixed(4)}`,
                        }}
                    ></Plot>}
        </div>
    );
}