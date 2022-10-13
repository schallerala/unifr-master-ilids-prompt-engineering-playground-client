import chroma from 'chroma-js';
import React, { useEffect } from 'react';
import {
    fetchClips,
    fetchPlayClip,
    selectClipsFiltering,
    selectFilteredClipsByCategory
} from './app/clipsSlice';
import { useAppDispatch, useAppSelector } from './app/hooks';
import {
    selectConfusionsMap,
    selectSimilaritiesMap,
    selectTopKSliceEnd
} from './app/similaritiesSlice';
import { toggleTextClassification } from './app/textsSlice';
import { API_BASE_URL } from './contants';
import { ClipIndex, ConfusionTopK } from './types';

function filterClipsByWrongTopK(
    showOnlyWrongTopK: number[],
    confusionMap: { [key: number]: ConfusionTopK }
): (i: ClipIndex) => boolean {
    if (showOnlyWrongTopK.length === 0) return () => true;

    return ({ index, isAlarm }: ClipIndex) => {
        const mismatch = Array.from(showOnlyWrongTopK.values()).some((topK) => {
            // is clip classification a miss match
            const textClassification =
                confusionMap[topK].topk_text_classification[index];
            return isAlarm !== textClassification;
        });

        return mismatch;
    };
}

export default function Clips() {
    const dispatch = useAppDispatch();

    const clips = useAppSelector(selectFilteredClipsByCategory);
    const { showOnlyWrongTopK } = useAppSelector(selectClipsFiltering);
    const confusionsMap = useAppSelector(selectConfusionsMap);
    const similarities = useAppSelector(selectSimilaritiesMap);
    const similaritiesTopK = useAppSelector(selectTopKSliceEnd);

    useEffect(() => {
        dispatch(fetchClips());
    }, [dispatch]);

    const percentageColorScale = chroma.scale(chroma.brewer.Spectral);

    const filteredOutClips = clips.filter(
        filterClipsByWrongTopK(showOnlyWrongTopK, confusionsMap)
    );

    const orderedTopK = Object.keys(confusionsMap).sort(
        (a, b) => Number(a) - Number(b)
    );

    return (
        <div>
            <h2>Clips</h2>
            <h4>
                {filteredOutClips.length} / {clips.length}
            </h4>
            <div
                className="images"
                style={{
                    display: 'grid',
                    gridTemplateColumns: '230px 180px 180px auto',
                    margin: '0 auto',
                    maxWidth: '1200px',
                    rowGap: '12px'
                }}
            >
                {filteredOutClips.map(
                    (
                        {
                            index,
                            isAlarm,
                            category,
                            distance,
                            approach,
                            description
                        },
                        i
                    ) => {
                        const categoryColor = {
                            Alarm: 'OrangeRed',
                            Background: 'DodgerBlue',
                            Distraction: 'ForestGreen'
                        }[category];

                        return (
                            <React.Fragment key={i}>
                                <div>
                                    <img
                                        className="clip-preview"
                                        src={`${API_BASE_URL}/image/${index}`}
                                        style={{ width: '100%' }}
                                    />
                                    <div
                                        style={{
                                            textAlign: 'center'
                                        }}
                                    >
                                        <span>{index} </span>
                                        <span
                                            onClick={() =>
                                                dispatch(fetchPlayClip(index))
                                            }
                                        >
                                            ⏯
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className="clip-category"
                                    style={{
                                        textAlign: 'center'
                                    }}
                                >
                                    <div
                                        style={{
                                            marginBottom: '6px',
                                            color: categoryColor
                                        }}
                                    >
                                        {category}
                                    </div>
                                    {!isAlarm ? (
                                        <></>
                                    ) : (
                                        <div style={{ fontSize: '0.8em' }}>
                                            <div>{description}</div>
                                            <div>{approach}</div>
                                            <div>{distance}% Screen Height</div>
                                        </div>
                                    )}
                                </div>
                                <span className="text-classifications">
                                    {orderedTopK.map((topk, ii) => {
                                        const { topk_text_classification } =
                                            confusionsMap[Number(topk)];
                                        const keyI = i * clips.length + ii;
                                        if (
                                            !(index in topk_text_classification)
                                        )
                                            console.warn(
                                                `Missing ${index} in topk map`
                                            );
                                        const textClassification =
                                            !!topk_text_classification[index];
                                        return (
                                            <div key={keyI}>
                                                TOP {topk}:
                                                <span
                                                    style={{
                                                        color: textClassification
                                                            ? 'OrangeRed'
                                                            : 'DodgerBlue'
                                                    }}
                                                >
                                                    {' '}
                                                    {textClassification
                                                        ? 'Alarm'
                                                        : 'Not alarm'}
                                                </span>
                                                <span>
                                                    {' '}
                                                    {isAlarm ===
                                                    textClassification
                                                        ? '✅'
                                                        : '❌'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </span>
                                <div
                                    className="clip-similarities"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        maxWidth: '520px'
                                    }}
                                >
                                    {similarities[index] &&
                                        similarities[index]
                                            .slice(0, similaritiesTopK)
                                            .map((similarity, ii) => {
                                                const keyI =
                                                    i * clips.length + ii;
                                                return (
                                                    <div
                                                        key={keyI}
                                                        style={{
                                                            display: 'flex',
                                                            gap: '6px'
                                                        }}
                                                    >
                                                        <div
                                                            className="similarity-percentage-representation"
                                                            style={{
                                                                height: '24px',
                                                                background:
                                                                    '#e2e2e2',
                                                                width: '160px'
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: `${
                                                                        similarity.similarity *
                                                                        100
                                                                    }%`,
                                                                    height: '100%',
                                                                    backgroundColor:
                                                                        percentageColorScale(
                                                                            similarity.similarity
                                                                        ).css()
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span
                                                            className="similarity-percentage"
                                                            style={{
                                                                width: '45px',
                                                                textAlign:
                                                                    'right'
                                                            }}
                                                        >
                                                            {(
                                                                similarity.similarity *
                                                                100
                                                            ).toFixed(2)}
                                                        </span>
                                                        <span
                                                            className="similarity-text"
                                                            style={{
                                                                flex: 1,
                                                                textAlign:
                                                                    'left',
                                                                color: similarity.classification
                                                                    ? 'OrangeRed'
                                                                    : 'DodgerBlue'
                                                            }}
                                                            onClick={() =>
                                                                dispatch(
                                                                    toggleTextClassification(
                                                                        similarity.text
                                                                    )
                                                                )
                                                            }
                                                        >
                                                            {similarity.text}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                </div>
                            </React.Fragment>
                        );
                    }
                )}
            </div>
        </div>
    );
}
