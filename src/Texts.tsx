import React, { useEffect } from 'react';
import { useLocalStorage } from 'react-use';
import { useAppDispatch, useAppSelector } from './app/hooks';
import {
    selectSelectedModelVariation,
    selectSelectedTextClassificationMethod
} from './app/optionsSlice';
import { fetchSimilarities } from './app/similaritiesSlice';
import {
    removeText,
    selectSubtractionTexts,
    selectTexts,
    setTexts,
    toggleAllTo,
    toggleTextClassification
} from './app/textsSlice';
import { linearizeTextClassification } from './utils';

export default function Texts() {
    const dispatch = useAppDispatch();

    const texts = useAppSelector(selectTexts);
    const [localTexts, setLocalText, _] = useLocalStorage<typeof texts>(
        'all-texts',
        []
    );
    const modelVariation = useAppSelector(selectSelectedModelVariation);
    const textClassification = useAppSelector(
        selectSelectedTextClassificationMethod
    );
    const subtractionTexts = useAppSelector(selectSubtractionTexts);

    useEffect(() => {
        if (localTexts) dispatch(setTexts(localTexts));
    }, [dispatch]);

    useEffect(() => {
        if (texts && (texts.length > 0 || localTexts?.length == 1))
            setLocalText(texts);
    }, [texts]);

    useEffect(() => {
        if (modelVariation && textClassification && texts && texts.length > 1)
            dispatch(
                fetchSimilarities({
                    texts: linearizeTextClassification(texts),
                    modelVariation,
                    textClassification,
                    subtractionTexts
                })
            );
    }, [texts, modelVariation, textClassification, subtractionTexts]);

    return (
        <div className="texts">
            <h2>
                Texts{' '}
                <span onClick={() => dispatch(toggleAllTo(true))}>🚨</span>{' '}
                <span onClick={() => dispatch(toggleAllTo(false))}>🔕</span>
            </h2>
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
                                dispatch(toggleTextClassification(text))
                            }
                        >
                            {text}
                        </span>
                        <span
                            className="text-delete"
                            onClick={() => dispatch(removeText(text))}
                        >
                            ❌
                        </span>
                    </React.Fragment>
                );
            })}
        </div>
    );
}
