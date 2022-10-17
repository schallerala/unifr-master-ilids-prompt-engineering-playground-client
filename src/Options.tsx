import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './app/hooks';
import {
    fetchModelVariations,
    fetchTextClassificationMethods,
    selectLoadingModelVariations,
    selectModelVariation,
    selectModelVariations,
    selectSelectedModelVariation,
    selectSelectedTextClassificationMethod,
    selectTextClassificationMethod,
    selectTextClassificationMethods
} from './app/optionsSlice';
import {
    selectApplySoftmax,
    toggleApplySoftmax
} from './app/similaritiesSlice';

export default function Options() {
    const dispatch = useAppDispatch();

    const modelVariations = useAppSelector(selectModelVariations);
    const textClassificationMethods = useAppSelector(
        selectTextClassificationMethods
    );

    const selectedModelVariation = useAppSelector(selectSelectedModelVariation);
    const selectedTextClassificationMethod = useAppSelector(
        selectSelectedTextClassificationMethod
    );

    const applySoftmax = useAppSelector(selectApplySoftmax);

    useEffect(() => {
        dispatch(fetchModelVariations());
        dispatch(fetchTextClassificationMethods());
    }, [dispatch]);

    useEffect(() => {
        if (modelVariations && modelVariations.length > 0)
            dispatch(selectModelVariation(modelVariations[0]));
    }, [modelVariations]);

    useEffect(() => {
        if (textClassificationMethods && textClassificationMethods.length > 0)
            dispatch(
                selectTextClassificationMethod(textClassificationMethods[0])
            );
    }, [textClassificationMethods]);

    return (
        <div style={{ display: 'flex', gap: '40px' }}>
            <div>
                <h3>Model variation selection</h3>
                {modelVariations &&
                    selectedModelVariation &&
                    modelVariations.map((variation, i) => {
                        const checked = variation === selectedModelVariation;
                        return (
                            <React.Fragment key={i}>
                                <input
                                    type="radio"
                                    name="model_variation"
                                    id={variation}
                                    defaultChecked={checked}
                                    onChange={() => {
                                        !checked &&
                                            dispatch(
                                                selectModelVariation(variation)
                                            );
                                    }}
                                />
                                <label htmlFor={variation}>{variation}</label>
                            </React.Fragment>
                        );
                    })}
            </div>
            <div>
                <h3>Text classification method</h3>
                {textClassificationMethods &&
                    selectedTextClassificationMethod &&
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
                                        dispatch(
                                            selectTextClassificationMethod(
                                                method
                                            )
                                        )
                                    }
                                />
                                <label htmlFor={method}>{method}</label>
                            </React.Fragment>
                        );
                    })}
            </div>
            <div>
                <h3>Softmax</h3>
                <input
                    type="checkbox"
                    name="apply-softmax"
                    id="apply-softmax"
                    onChange={() => dispatch(toggleApplySoftmax())}
                    defaultChecked={applySoftmax}
                />
                <label htmlFor="apply-softmax">
                    Apply Softmax to similarities
                </label>
            </div>
        </div>
    );
}
