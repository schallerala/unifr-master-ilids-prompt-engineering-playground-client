import { useEffect } from 'react';
import Plot from 'react-plotly.js';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { selectSelectedModelVariation } from './app/optionsSlice';
import { selectTexts } from './app/textsSlice';
import {
    fetchTsneImages,
    fetchTsneTexts,
    selectTsneImagesPlotlyData,
    selectTsneTextsPlotlyData
} from './app/tsnesSlice';
import { linearizeTextClassification } from './utils';

export default function Tsne() {
    const dispatch = useAppDispatch();

    const modelVariation = useAppSelector(selectSelectedModelVariation);
    const imagesTsneData = useAppSelector(selectTsneImagesPlotlyData);
    const textsTsneData = useAppSelector(selectTsneTextsPlotlyData);
    const texts = useAppSelector(selectTexts);

    useEffect(() => {
        if (modelVariation)
            dispatch(
                fetchTsneImages({ modelVariation, texts: texts.map((t) => t.text) })
            );
    }, [modelVariation, texts, dispatch]);

    useEffect(() => {
        if (texts && texts.length > 0 && modelVariation) {
            dispatch(
                fetchTsneTexts({
                    texts: linearizeTextClassification(texts),
                    modelVariation
                })
            );
        }
    }, [texts, modelVariation, dispatch]);

    return (
        <div className="tsne-plots" style={{ display: 'flex', gap: '20px' }}>
            <Plot
                data={imagesTsneData}
                layout={{ height: 640, title: 'Sequences Features' }}
                style={{ flex: 1 }}
            />
            <Plot
                data={textsTsneData}
                layout={{ height: 640, title: 'Texts Features' }}
                style={{ flex: 1 }}
            />
        </div>
    );
}
