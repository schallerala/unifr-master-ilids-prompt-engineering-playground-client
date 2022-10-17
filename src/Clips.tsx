import chroma from 'chroma-js';
import { range } from 'radash';
import React, { useEffect } from 'react';

import {
    fetchClips,
    fetchPlayClip,
    selectFilteredClips,
    selectTotalClips
} from './app/clipsSlice';
import { useAppDispatch, useAppSelector } from './app/hooks';
import {
    selectApplySoftmax,
    selectConfusionsMap,
    selectMaxSimilarity,
    selectMinSimilarity,
    selectSimilaritiesMap,
    selectTopKSliceEnd
} from './app/similaritiesSlice';
import { toggleTextClassification } from './app/textsSlice';
import { API_BASE_URL } from './contants';

export default function Clips() {
    const dispatch = useAppDispatch();

    const totalClips = useAppSelector(selectTotalClips);
    const filteredOutClips = useAppSelector(selectFilteredClips);
    const confusionsMap = useAppSelector(selectConfusionsMap);
    const similarities = useAppSelector(selectSimilaritiesMap);
    const minSimilarity = useAppSelector(selectMinSimilarity);
    const maxSimilarity = useAppSelector(selectMaxSimilarity);
    const similaritiesTopK = useAppSelector(selectTopKSliceEnd);

    const applySoftmax = useAppSelector(selectApplySoftmax);

    useEffect(() => {
        dispatch(fetchClips());
    }, [dispatch]);

    const percentageColorScale = chroma.scale(chroma.brewer.Spectral);

    const displayedClipsCount = filteredOutClips.length;

    const orderedTopK = Object.keys(confusionsMap).sort(
        (a, b) => Number(a) - Number(b)
    );

    const categoryColors = {
        Alarm: 'OrangeRed',
        Background: 'DodgerBlue',
        Distraction: 'ForestGreen'
    } as { [key: string]: string };

    function renderPreview(rowIndex: number, colIndex: number) {
        const clipName = filteredOutClips[rowIndex].index;

        return (
            <div key={rowIndex * displayedClipsCount + colIndex}>
                <img
                    className="clip-preview"
                    src={`${API_BASE_URL}/image/${clipName}`}
                    style={{ width: '100%' }}
                />
                <div
                    style={{
                        textAlign: 'center'
                    }}
                >
                    <span>{clipName} </span>
                    <span onClick={() => dispatch(fetchPlayClip(clipName))}>
                        ⏯
                    </span>
                </div>
            </div>
        );
    }

    function renderCategory(rowIndex: number, colIndex: number) {
        const { category, isAlarm, description, approach, distance } =
            filteredOutClips[rowIndex];

        const categoryColor = categoryColors[category];

        return (
            <div
                key={rowIndex * displayedClipsCount + colIndex}
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
        );
    }

    function renderTopKClassification(rowIndex: number, colIndex: number) {
        const { index, isAlarm } = filteredOutClips[rowIndex];

        return (
            <span
                key={rowIndex * displayedClipsCount + colIndex}
                className="text-classifications"
            >
                {orderedTopK.map((topk) => {
                    const { topk_text_classification } =
                        confusionsMap[Number(topk)];
                    const keyI = `${
                        rowIndex * displayedClipsCount + colIndex
                    }-${topk}`;

                    if (!(index in topk_text_classification))
                        console.warn(`Missing ${index} in topk map`);

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
                                {textClassification ? 'Alarm' : 'Not alarm'}
                            </span>
                            <span>
                                {' '}
                                {isAlarm === textClassification ? '✅' : '❌'}
                            </span>
                        </div>
                    );
                })}
            </span>
        );
    }

    const diff = maxSimilarity - minSimilarity;

    const similarityPercentage = applySoftmax
        ? (similarity: number) => {
              return similarity;
          }
        : (similarity: number) => {
              return (((similarity - minSimilarity) / diff) * 98 + 2) / 100;
          };

    const similarityToString = applySoftmax
        ? (similarity: number) => {
              return (similarity * 100).toFixed(2);
          }
        : (similarity: number) => {
              return similarity.toFixed(2);
          };

    function renderSimilarities(rowIndex: number, colIndex: number) {
        const { index } = filteredOutClips[rowIndex];

        return (
            <div
                key={rowIndex * displayedClipsCount + colIndex}
                className="clip-similarities"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    maxWidth: '520px'
                }}
            >
                {index in similarities &&
                    similarities[index]
                        .slice(0, similaritiesTopK)
                        .map((similarity) => {
                            const keyI = `${rowIndex}-${similarity.text}`;

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
                                            background: '#e2e2e2',
                                            width: '160px'
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${
                                                    similarityPercentage(
                                                        similarity.similarity
                                                    ) * 100
                                                }%`,
                                                height: '100%',
                                                backgroundColor:
                                                    percentageColorScale(
                                                        similarityPercentage(
                                                            similarity.similarity
                                                        )
                                                    ).css()
                                            }}
                                        ></div>
                                    </div>
                                    <span
                                        className="similarity-percentage"
                                        style={{
                                            width: '45px',
                                            textAlign: 'right'
                                        }}
                                    >
                                        {similarityToString(
                                            similarity.similarity
                                        )}
                                    </span>
                                    <span
                                        className="similarity-text"
                                        style={{
                                            flex: 1,
                                            textAlign: 'left',
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
        );
    }

    const renders = [
        renderPreview,
        renderCategory,
        renderTopKClassification,
        renderSimilarities
    ];

    // const CellRender = ({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
    //     return renders[columnIndex](rowIndex, style)
    // };

    // const rowHeight = !showAllSimilarities ? 210 : Math.max(210, textCount * 28)

    return (
        <div>
            <h2>Clips</h2>
            <h4>
                {filteredOutClips.length} / {totalClips}
            </h4>
            {/* <Grid
                columnCount={4}
                columnWidth={index => [240, 180, 180, (width - 600)][index]}
                rowCount={filteredOutClips.length}
                rowHeight={i => rowHeight + 12}
                height={(rowHeight + 12) * filteredOutClips.length}
                width={Math.min(1200, width)}
            >
                {CellRender}
            </Grid> */}
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
                {filteredOutClips.length &&
                    Array.from(range(0, filteredOutClips.length - 1)).map(
                        (i) => {
                            return (
                                <React.Fragment key={i}>
                                    {renders.map((colRender, ii) =>
                                        colRender(i, ii)
                                    )}
                                </React.Fragment>
                            );
                        }
                    )}
            </div>
        </div>
    );
}
