import { useAppSelector } from './app/hooks';
import { selectClipsLoading } from './app/clipsSlice';
import {
    selectLoadingModelVariations,
    selectLoadingTextClassificationMethods
} from './app/optionsSlice';
import { selectSimilaritiesLoading } from './app/similaritiesSlice';
import {
    selectTsneLoadingImages,
    selectTsneLoadingTexts
} from './app/tsnesSlice';

export default function LoadingIndicator() {
    const clipsLoading = useAppSelector(selectClipsLoading);
    const modelVariationsLoading = useAppSelector(selectLoadingModelVariations);
    const textClassificationsLoading = useAppSelector(
        selectLoadingTextClassificationMethods
    );
    const similaritiesLoading = useAppSelector(selectSimilaritiesLoading);
    const tsneImageLoading = useAppSelector(selectTsneLoadingImages);
    const tsneTextLoading = useAppSelector(selectTsneLoadingTexts);

    const anyLoading =
        clipsLoading ||
        modelVariationsLoading ||
        textClassificationsLoading ||
        similaritiesLoading ||
        tsneImageLoading ||
        tsneTextLoading;

    const texts = [
        [clipsLoading, 'clips descriptions'],
        [modelVariationsLoading, 'model variations'],
        [textClassificationsLoading, 'text classification methods'],
        [similaritiesLoading, 'similarities and confusion matrices'],
        [tsneImageLoading, 'video features t-SNE'],
        [tsneTextLoading, 'text features t-SNE']
    ];

    return (
        <h4
            style={{
                textAlign: 'center',
                visibility: anyLoading ? 'visible' : 'hidden'
            }}
        >
            Is loading:{' '}
            {texts
                .filter(([isLoading, t]) => isLoading)
                .map(([i, t]) => t)
                .join(', ')}
            ...
        </h4>
    );
}
