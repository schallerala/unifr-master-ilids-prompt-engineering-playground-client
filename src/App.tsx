import React, { useState, useEffect } from 'react';

import * as Plotly from 'plotly.js';
import Plot from 'react-plotly.js';

import chroma from 'chroma-js';

import { useEffectOnce, useLocalStorage } from 'react-use';

const API_BASE_URL = 'http://localhost:8000';

// type ModelVariation =
//     | 'vit-b-16-16f'
//     | 'vit-b-16-32f'
//     | 'vit-b-16-8f'
//     | 'vit-b-32-8f';

interface PLotlyDataLayout {
    data: Plotly.Data[];
    layout: Partial<Plotly.Layout>;
}

interface TsneCategory {
    name: string;
    text: string[];
    x: number[];
    y: number[];
}

interface TsneCategoryResponse {
    text: string[];
    x: number[];
    y: number[];
}

interface ClipSimilarity {
    text: string;
    classification: boolean;
    similarity: number; // [0, 1]
}

interface ConfusionTopK {
    tp: number;
    fn: number;
    fp: number;
    tn: number;
    topkTextClassification: Map<string, boolean>;
}

interface SimilarityResponse {
    similarities: Map<string, ClipSimilarity[]>;
    confusion: Map<number, ConfusionTopK>;
}

interface ClipIndex {
    index: string;
    category: string;
    isAlarm: boolean;
    distance?: number;
    approach?: string;
    description?: string;
}

async function queryAllClips(): Promise<ClipIndex[]> {
    const response = await fetch(API_BASE_URL + '/images');
    if (!response.ok) return Promise.reject(response);

    const responseObj = await response.json();
    return responseObj.index.map((clip: string, i: number) => ({
        index: clip,
        category: responseObj.categories[i],
        isAlarm: responseObj.categories[i] === 'Alarm',
        distance: responseObj.distances[i],
        approach: responseObj.approaches[i],
        description: responseObj.descriptions[i]
    }));
}

async function queryAllTexts(): Promise<
    { text: string; classification: boolean }[]
> {
    const response = await fetch(API_BASE_URL + '/text');
    if (!response.ok) return Promise.reject(response);

    const responseObj = await response.json();
    return responseObj.text.map((text: string, i: number) => ({
        text,
        classification: responseObj.classification[i]
    }));
}

async function queryImagesFeaturesTsne(
    modelVariation: string
): Promise<TsneCategory[]> {
    const response = await fetch(
        API_BASE_URL + `/tsne-images/${modelVariation}`
    );
    if (!response.ok) return Promise.reject(response);

    const arrayResponse = await response.json();
    return Object.entries(arrayResponse).map(([key, value]) => {
        return {
            name: key,
            text: (value as TsneCategoryResponse).text,
            x: (value as TsneCategoryResponse).x,
            y: (value as TsneCategoryResponse).y
        };
    });
}

async function queryTextsFeaturesTsne(): Promise<TsneCategory[]> {
    const response = await fetch(API_BASE_URL + '/tsne-texts');
    if (!response.ok) return Promise.reject(response);

    const arrayResponse = await response.json();
    return Object.entries(arrayResponse).map(([key, value]) => {
        return {
            name: key,
            text: (value as TsneCategoryResponse).text,
            x: (value as TsneCategoryResponse).x,
            y: (value as TsneCategoryResponse).y
        };
    });
}

async function queryAddText(text: string, classification: boolean) {
    const response = await fetch(API_BASE_URL + `/text/add`, {
        method: 'POST',
        body: JSON.stringify({
            text,
            classification
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) return Promise.reject(response);
}

async function queryAddAllTexts(
    list: { text: string; classification: boolean }[]
) {
    const response = await fetch(API_BASE_URL + `/text/add-all`, {
        method: 'POST',
        body: JSON.stringify({
            texts: list.map(({ text }) => text),
            classifications: list.map(({ classification }) => classification)
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) return Promise.reject(response);
}

async function queryDeleteText(text: string) {
    const response = await fetch(API_BASE_URL + `/text`, {
        method: 'DELETE',
        body: JSON.stringify({
            text
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) return Promise.reject(response);
}

async function querySimilarities(
    modelVariation: string,
    textClassification: string
): Promise<SimilarityResponse> {
    const params = new URLSearchParams();
    params.append('variation', modelVariation);
    params.append('text_classification', textClassification);

    const response = await fetch(
        API_BASE_URL + `/similarity?` + params.toString()
    );
    if (!response.ok) return Promise.reject(response);

    const responseObj = await response.json();
    return {
        similarities: new Map(Object.entries(responseObj.similarities)),
        confusion: new Map(
            Object.entries(responseObj.confusion).map(([topk, v]) => {
                return [
                    Number.parseInt(topk),
                    {
                        tp: (v as any).tp,
                        fn: (v as any).fn,
                        fp: (v as any).fp,
                        tn: (v as any).tn,
                        topkTextClassification: new Map(
                            Object.entries((v as any).topk_text_classification)
                        )
                    } as ConfusionTopK
                ];
            })
        )
    };
}

async function queryUpdateTextClassification(
    text: string,
    new_classification: boolean
): Promise<void> {
    const response = await fetch(API_BASE_URL + `/text`, {
        method: 'PUT',
        body: JSON.stringify({
            text,
            classification: new_classification
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) return Promise.reject(response);
}

function transformTsneResponseToPlotly(
    response: TsneCategory[]
): Plotly.Data[] {
    return response.map(({ x, y, name, text }) => ({
        x,
        y,
        name,
        text,
        type: 'scatter',
        mode: 'markers'
    }));
}

function getTopKSimilarity(
    clipSimilarity: ClipSimilarity[] | undefined,
    topk: number = -1
): ClipSimilarity[] | undefined {
    if (!clipSimilarity) {
        return undefined;
    }

    const sliceEnd = topk <= 0 ? clipSimilarity.length : topk;

    return Array.from(clipSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, sliceEnd);
}

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

function filterClipsByCategory(
    showAlarms: boolean,
    showNotAlarms: boolean
): (i: ClipIndex) => boolean {
    return ({ isAlarm }: ClipIndex) => {
        if (isAlarm) return showAlarms;
        else return showNotAlarms;
    };
}

function filterClipsByWrongTopK(
    showOnlyWrongTopK: Set<number>,
    confusionMap: Map<number, ConfusionTopK>
): (i: ClipIndex) => boolean {
    if (showOnlyWrongTopK.size === 0) return () => true;

    return ({ index, isAlarm }: ClipIndex) => {
        const mismatch = Array.from(showOnlyWrongTopK.values()).some((topK) => {
            // is clip classification a miss match
            const textClassification = confusionMap
                .get(topK)
                ?.topkTextClassification.get(index);
            return isAlarm !== textClassification;
        });

        return mismatch;
    };
}

async function queryAllModelVariations(): Promise<string[]> {
    const response = await fetch(API_BASE_URL + `/variations`);
    if (!response.ok) return Promise.reject(response);

    return await response.json();
}

async function queryAllTextClassificationMethods(): Promise<string[]> {
    const response = await fetch(API_BASE_URL + `/text-classification`);
    if (!response.ok) return Promise.reject(response);

    return await response.json();
}

async function queryPlayVideo(clip: string) {
    const response = await fetch(API_BASE_URL + `/play/${clip}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) return Promise.reject(response);
}

function App() {
    /**
     * Use to set the classification of the new text
     */
    const [isPositive, setPositive] = useState<boolean>(true);
    const [clips, setClips] = useState<ClipIndex[]>([]);
    const [modelVariations, setModelVariations] = useState<string[]>([]);
    const [textClassificationMethods, setTextClassificationMethods] = useState<
        string[]
    >([]);
    const [selectedModelVariation, setSelectedModelVariation] =
        useState<string>();
    const [
        selectedTextClassificationMethod,
        setSelectedTextClassificationMethod
    ] = useState<string>();
    const [showAlarms, setShowAlarms] = useState<boolean>(true);
    const [showNotAlarms, setShowNotAlarms] = useState<boolean>(true);
    const [imagesTsne, setImagesTsne] = useState<Plotly.Data[]>();
    const [textsTsne, setTextsTsne] = useState<Plotly.Data[]>();
    const [texts, setTexts] = useState<
        { text: string; classification: boolean }[]
    >([]);
    const [inputText, setInputText] = useState<string>('');
    const [localTexts, setLocalText, _] = useLocalStorage<typeof texts>(
        'all-texts',
        []
    );
    const [showOnlyWrongTopK, setShowOnlyWrongTopK] = useState<Set<number>>(
        new Set()
    );
    const [showAllSimilarities, setShowAllSimilarities] =
        useState<boolean>(false);
    const [similarityLoading, setSimilarityLoading] = useState<boolean>(false);
    const [similarityMap, setSimilarityMap] = useState<
        Map<string, ClipSimilarity[]>
    >(new Map());
    const [confusionMap, setConfusionMap] = useState<
        Map<number, ConfusionTopK>
    >(new Map());

    const percentageColorScale = chroma.scale(chroma.brewer.Spectral);

    useEffectOnce(() => {
        queryAllModelVariations().then((variations) => {
            setModelVariations(variations);
            setSelectedModelVariation(variations[0]);
        });
    });

    useEffectOnce(() => {
        queryAllTextClassificationMethods().then((methods) => {
            setTextClassificationMethods(methods);
            setSelectedTextClassificationMethod(methods[0]);
        });
    });

    useEffectOnce(() => {
        queryAllClips().then((clipsResponse) => setClips(clipsResponse));
    });

    useEffect(() => {
        if (selectedModelVariation) {
            queryImagesFeaturesTsne(selectedModelVariation).then(
                (imagesTsneResponse) =>
                    setImagesTsne(
                        transformTsneResponseToPlotly(imagesTsneResponse)
                    )
            );
        }
    }, [selectedModelVariation]);

    useEffectOnce(() => {
        const pushAndQueryAllTexts = async () => {
            await queryAddAllTexts(localTexts || []);
            const allTextsResponse = await queryAllTexts();
            setTexts(allTextsResponse);
        };

        pushAndQueryAllTexts();
    });

    useEffect(() => {
        if (
            !(
                texts &&
                texts.length &&
                selectedModelVariation &&
                selectedTextClassificationMethod
            )
        )
            return;

        setSimilarityLoading(true);
        querySimilarities(
            selectedModelVariation,
            selectedTextClassificationMethod
        ).then(({ similarities, confusion }) => {
            setConfusionMap(confusion);
            setSimilarityMap(similarities);
            setSimilarityLoading(false);
        });
        setLocalText(texts);
        queryTextsFeaturesTsne().then((textsTsneResponse) =>
            setTextsTsne(transformTsneResponseToPlotly(textsTsneResponse))
        );
    }, [
        texts,
        selectedModelVariation,
        selectedTextClassificationMethod,
        setSimilarityLoading,
        setConfusionMap,
        setSimilarityMap,
        setLocalText,
        setTextsTsne
    ]);

    const filteredOutClips = clips
        .filter(filterClipsByCategory(showAlarms, showNotAlarms))
        .filter(filterClipsByWrongTopK(showOnlyWrongTopK, confusionMap));

    return (
        <div className="App">
            <div style={{ display: 'flex', gap: '40px' }}>
                <div>
                    <h3>Model variation selection</h3>
                    {modelVariations &&
                        modelVariations.map((variation, i) => {
                            const checked =
                                variation === selectedModelVariation;
                            return (
                                <React.Fragment key={i}>
                                    <input
                                        type="radio"
                                        name="model_variation"
                                        id={variation}
                                        defaultChecked={checked}
                                        onChange={() =>
                                            !checked &&
                                            setSelectedModelVariation(variation)
                                        }
                                    />
                                    <label htmlFor={variation}>
                                        {variation}
                                    </label>
                                </React.Fragment>
                            );
                        })}
                </div>
                <div>
                    <h3>Text classification method</h3>
                    {textClassificationMethods &&
                        textClassificationMethods.map((method, i) => {
                            const checked =
                                method === selectedTextClassificationMethod;
                            return (
                                <React.Fragment key={i}>
                                    <input
                                        type="radio"
                                        name="text_classification_method"
                                        id={method}
                                        defaultChecked={checked}
                                        onChange={() =>
                                            !checked &&
                                            setSelectedTextClassificationMethod(
                                                method
                                            )
                                        }
                                    />
                                    <label htmlFor={method}>{method}</label>
                                </React.Fragment>
                            );
                        })}
                </div>
            </div>
            <div
                className="top"
                style={{
                    fontSize: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    margin: '6px auto 0 auto'
                }}
            >
                <input
                    style={{
                        width: '700px',
                        height: '72px',
                        fontSize: '40px'
                    }}
                    value={inputText}
                    onChange={(event) => setInputText(event.target.value)}
                    onKeyUp={(event) =>
                        event.key === 'Enter' &&
                        queryAddText(inputText, isPositive).then(() => {
                            setTexts([
                                ...texts,
                                { text: inputText, classification: isPositive }
                            ]);
                            setInputText('');
                        })
                    }
                />
                <span
                    onClick={() => setPositive(!isPositive)}
                    style={{
                        margin: '0 6px',
                        padding: '7px 12px 12px',
                        border: '1px solid Gray',
                        borderRadius: '4px'
                    }}
                >
                    {isPositive ? '+' : '-'}
                </span>
            </div>
            <div
                className="tsne-plots"
                style={{ display: 'flex', gap: '20px' }}
            >
                <Plot
                    data={imagesTsne ? imagesTsne : []}
                    layout={{ height: 640, title: 'Sequences Features' }}
                    style={{ flex: 1 }}
                />
                <Plot
                    data={textsTsne ? textsTsne : []}
                    layout={{ height: 640, title: 'Texts Features' }}
                    style={{ flex: 1 }}
                />
            </div>
            <h4
                style={{
                    textAlign: 'center',
                    visibility: similarityLoading ? 'visible' : 'hidden'
                }}
            >
                Loading...
            </h4>
            <div
                style={{
                    display: 'flex',
                    gap: '35px',
                    justifyContent: 'center'
                }}
            >
                {Array.from(confusionMap.entries())
                    .sort((a, b) => a[0] - b[0])
                    .map(([topk, confusion], i) => (
                        <Plot
                            key={i}
                            {...getConfusionMatrixData(topk, confusion)}
                        />
                    ))}
            </div>
            <div className="texts">
                <h2>Texts</h2>
                {texts.map(({ text, classification }, i) => {
                    return (
                        <React.Fragment key={i}>
                            <span
                                className="text"
                                style={{
                                    color: classification
                                        ? 'OrangeRed'
                                        : 'DodgerBlue'
                                }}
                                onClick={() =>
                                    queryUpdateTextClassification(
                                        text,
                                        !classification
                                    ).then(() =>
                                        setTexts(
                                            texts.map((t) => ({
                                                text: t.text,
                                                classification:
                                                    t.text === text
                                                        ? !classification
                                                        : t.classification
                                            }))
                                        )
                                    )
                                }
                            >
                                {text}
                            </span>
                            <span
                                className="text-delete"
                                onClick={() =>
                                    queryDeleteText(text).then(() =>
                                        setTexts(
                                            texts.filter(
                                                (t2) => t2.text !== text
                                            )
                                        )
                                    )
                                }
                            >
                                ❌
                            </span>
                        </React.Fragment>
                    );
                })}
            </div>
            <div>
                Show:
                <label>
                    <input
                        type="checkbox"
                        defaultChecked={showAlarms}
                        onChange={() => setShowAlarms(!showAlarms)}
                    />
                    Alarms
                </label>
                <label>
                    <input
                        type="checkbox"
                        defaultChecked={showNotAlarms}
                        onChange={() => setShowNotAlarms(!showNotAlarms)}
                    />
                    Not Alarms
                </label>
            </div>
            <div>
                Show only <b>wrong</b> TOP K:
                {[1, 3, 5].map((i) => {
                    const topKChecked = showOnlyWrongTopK.has(i);
                    return (
                        <label key={i}>
                            <input
                                type="checkbox"
                                defaultChecked={topKChecked}
                                onChange={() => {
                                    if (topKChecked) {
                                        // remove
                                        const newSet = new Set(
                                            showOnlyWrongTopK
                                        );
                                        newSet.delete(i);
                                        setShowOnlyWrongTopK(newSet);
                                    } else {
                                        // add
                                        setShowOnlyWrongTopK(
                                            new Set(showOnlyWrongTopK).add(i)
                                        );
                                    }
                                }}
                            />
                            K = {i}
                        </label>
                    );
                })}
            </div>
            <div>
                Show:
                <label>
                    <input
                        type="checkbox"
                        defaultChecked={showAllSimilarities}
                        onChange={() =>
                            setShowAllSimilarities(!showAllSimilarities)
                        }
                    />
                    All similarities score
                </label>
            </div>
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
                {filteredOutClips
                    .slice(0, 20)
                    .map(
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

                            const orderedTopK = Array.from(
                                confusionMap.keys()
                            ).sort((a, b) => a - b);

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
                                                    queryPlayVideo(index).catch(
                                                        (e) => console.error(e)
                                                    )
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
                                                <div>
                                                    {distance}% Screen Height
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-classifications">
                                        {orderedTopK.map((topk, ii) => {
                                            const { topkTextClassification } =
                                                confusionMap.get(topk)!;
                                            const keyI = i * clips.length + ii;
                                            if (
                                                !topkTextClassification.has(
                                                    index
                                                )
                                            )
                                                console.warn(
                                                    `Missing ${index} in topk map`
                                                );
                                            const textClassification =
                                                !!topkTextClassification.get(
                                                    index
                                                );
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
                                        {similarityMap &&
                                            getTopKSimilarity(
                                                similarityMap.get(index),
                                                showAllSimilarities ? -1 : 6
                                            )?.map((similarity, ii) => {
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

export default App;
