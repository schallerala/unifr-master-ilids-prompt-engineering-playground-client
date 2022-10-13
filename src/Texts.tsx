import React, { useEffect } from 'react';
import { useEffectOnce, useLocalStorage } from 'react-use';
import { useAppDispatch, useAppSelector } from './app/hooks';
import {
    selectSelectedModelVariation,
    selectSelectedTextClassificationMethod
} from './app/optionsSlice';
import { fetchSimilarities } from './app/similaritiesSlice';
import {
    removeText,
    selectTexts,
    setTexts,
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

    useEffect(() => {
        if (localTexts) dispatch(setTexts(localTexts));
    }, [dispatch]);

    useEffect(() => {
        if (texts && (texts.length > 0 || localTexts?.length == 1))
            setLocalText(texts);
    }, [texts]);

    useEffect(() => {
        if (modelVariation && textClassification)
            dispatch(
                fetchSimilarities({
                    texts: linearizeTextClassification(texts),
                    modelVariation,
                    textClassification
                })
            );
    }, [texts, modelVariation, textClassification]);

    return (
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
