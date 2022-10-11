import React, { useState, useEffect } from 'react';

import * as Plotly from 'plotly.js';
import Plot from 'react-plotly.js';

import chroma from 'chroma-js';

import { useEffectOnce, useLocalStorage } from 'react-use';
import { createWatchProgram } from 'typescript';

const API_BASE_URL = 'http://localhost:8000';

type ModelVariation =
    | 'vit-b-16-16f'
    | 'vit-b-16-32f'
    | 'vit-b-16-8f'
    | 'vit-b-32-8f';

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

function renderConfusionPopulation(population: number | null): string {
    return population ? `${population}` : '-';
}

async function queryAllClips(): Promise<{ index: string; category: string }[]> {
    const response = await fetch(API_BASE_URL + '/images');
    if (!response.ok) return Promise.reject(response);

    const responseObj = await response.json();
    return responseObj.index.map((clip: string, i: number) => ({
        index: clip,
        category: responseObj.categories[i]
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

async function postText(text: string, classification: boolean) {
    const response = await fetch(API_BASE_URL + '/text/add', {
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

async function queryImagesFeaturesTsne(
    modelVariation: ModelVariation = 'vit-b-16-8f'
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

async function querySimilarities(): Promise<SimilarityResponse> {
    const response = await fetch(API_BASE_URL + `/similarity`, {
        // body: JSON.stringify({
        //   text,
        // }),
        // headers: {
        //   'Content-Type': 'application/json'
        // }
    });
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

function App() {
    const [isPositive, setPositive] = useState<boolean>(true);
    const [clips, setClips] = useState<{ index: string; category: string }[]>(
        []
    );
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
    const [similarityMap, setSimilarityMap] = useState<
        Map<string, ClipSimilarity[]>
    >(new Map());
    const [confusionMap, setConfusionMap] = useState<
        Map<number, ConfusionTopK>
    >(new Map());

    const percentageColorScale = chroma.scale(chroma.brewer.Spectral);

    useEffectOnce(() => {
        queryAllClips().then((clipsResponse) => setClips(clipsResponse));
    });

    useEffectOnce(() => {
        queryImagesFeaturesTsne().then((imagesTsneResponse) =>
            setImagesTsne(transformTsneResponseToPlotly(imagesTsneResponse))
        );
    });

    useEffectOnce(() => {
        const pushAndQueryAllTexts = async () => {
            await queryAddAllTexts(localTexts || []);
            const allTextsResponse = await queryAllTexts();
            setTexts(allTextsResponse);
        };

        pushAndQueryAllTexts();
    });

    useEffect(() => {
        if (!(texts && texts.length)) return;

        querySimilarities().then(({ similarities, confusion }) => {
            setConfusionMap(confusion);
            setSimilarityMap(similarities);
        });
        setLocalText(texts);
        queryTextsFeaturesTsne().then((textsTsneResponse) =>
            setTextsTsne(transformTsneResponseToPlotly(textsTsneResponse))
        );
    }, [texts]);

    return (
        <div className="App">
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
                                                (t2) => t2.text != text
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
            <div
                className="images"
                style={{
                    display: 'grid',
                    gridTemplateColumns: '220px 180px 180px auto',
                    margin: '0 auto',
                    maxWidth: '1200px',
                    rowGap: '12px'
                }}
            >
                {clips.map(({ index, category }, i) => {
                    const categoryColor = {
                        Alarm: 'OrangeRed',
                        Background: 'DodgerBlue',
                        Distraction: 'ForestGreen'
                    }[category];

                    const isAlarm = category === 'Alarm';

                    return (
                        <React.Fragment key={i}>
                            <div>
                                <img
                                    className="clip-preview"
                                    src={`${API_BASE_URL}/image/${index}`}
                                    style={{ width: '100%' }}
                                />
                                <span
                                    style={{
                                        textAlign: 'center',
                                        display: 'block'
                                    }}
                                >
                                    {index}
                                </span>
                            </div>
                            <span
                                className="clip-category"
                                style={{
                                    color: categoryColor,
                                    textAlign: 'center'
                                }}
                            >
                                {category}
                            </span>
                            <span className="text-classifications">
                                {confusionMap &&
                                    Array.from(confusionMap.entries())
                                        .sort((a, b) => a[0] - b[0])
                                        .map(
                                            (
                                                [
                                                    topk,
                                                    { topkTextClassification }
                                                ],
                                                ii
                                            ) => {
                                                const keyI =
                                                    i * clips.length + ii;
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
                                                            {isAlarm ==
                                                            textClassification
                                                                ? '✅'
                                                                : '❌'}
                                                        </span>
                                                    </div>
                                                );
                                            }
                                        )}
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
                                        6
                                    )?.map((similarity, ii) => {
                                        const keyI = i * clips.length + ii;
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
                                                        textAlign: 'right'
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
                                                        textAlign: 'left',
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
                })}
            </div>
        </div>
    );
}

export default App;
