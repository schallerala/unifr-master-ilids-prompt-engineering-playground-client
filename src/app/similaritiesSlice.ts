import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from './store';
import { API_BASE_URL } from '../contants';
import {
    ClipSimilarity,
    ConfusionTopK,
    LinearizedTextClassification
} from '../types';

export interface SimilarityResponse {
    similarities: { [key: string]: ClipSimilarity[] };
    max: number;
    min: number;
    confusion: { [key: number]: ConfusionTopK };
}

type FetchProps = {
    texts: LinearizedTextClassification;
    modelVariation: string;
    textClassification: string;
    subtractionTexts: string | undefined;
    applySoftmax: boolean;
};

let lastSimilarityAbortController: AbortController | undefined = undefined;

export const fetchSimilarities = createAsyncThunk(
    'similarities/fetch',
    async ({
        texts: [texts, classifications],
        modelVariation,
        textClassification,
        subtractionTexts,
        applySoftmax
    }: FetchProps) => {
        if (lastSimilarityAbortController) {
            console.log('Stopping previous fetch');
            lastSimilarityAbortController.abort();
        }

        lastSimilarityAbortController = new AbortController();

        const response = await fetch(API_BASE_URL + `/similarity`, {
            method: 'POST',
            body: JSON.stringify({
                model_variation: modelVariation,
                text_classification_method: textClassification,
                texts,
                classifications,
                texts_to_subtract:
                    subtractionTexts && subtractionTexts.length
                        ? subtractionTexts
                              .split(',')
                              .map((t) => t.trim())
                              .filter((t) => t && t.length)
                        : null,
                apply_softmax: applySoftmax
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            signal: lastSimilarityAbortController.signal
        });

        lastSimilarityAbortController = undefined;

        if (!response.ok) return Promise.reject(response);

        const responseObj = await response.json();

        return responseObj as SimilarityResponse;
    }
);

type TopK = -1 | 6;

interface SimilaritiesState {
    applySoftmax: boolean;
    loading: boolean;
    similaritiesMap: { [key: string]: ClipSimilarity[] };
    minSimilarity: number;
    maxSimilarity: number;
    confusionsMap: { [key: number]: ConfusionTopK };
    topk: TopK;
}

const initialState: SimilaritiesState = {
    applySoftmax: true,
    loading: false,
    similaritiesMap: {},
    minSimilarity: 1000, // fake value
    maxSimilarity: -1, // fake value
    confusionsMap: {},
    topk: 6
};

export const similaritiesSlice = createSlice({
    name: 'similarities',
    initialState,
    reducers: {
        toggleApplySoftmax: (state) => {
            state.applySoftmax = !state.applySoftmax;
        },
        toggleShowAllSimilarities: (state) => {
            state.topk = state.topk === -1 ? 6 : -1;
        }
    },
    extraReducers(builder) {
        builder
            .addCase(fetchSimilarities.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchSimilarities.fulfilled, (state, action) => {
                state.loading = false;
                state.similaritiesMap = action.payload.similarities;
                state.minSimilarity = action.payload.min;
                state.maxSimilarity = action.payload.max;
                state.confusionsMap = action.payload.confusion;
            });
    }
});

// Action creators are generated for each case reducer function
export const { toggleApplySoftmax, toggleShowAllSimilarities } =
    similaritiesSlice.actions;

export const selectSimilaritiesLoading = (state: RootState) =>
    state.similarities.loading;
export const selectApplySoftmax = (state: RootState) =>
    state.similarities.applySoftmax;
export const selectSimilaritiesMap = (state: RootState) =>
    state.similarities.similaritiesMap;
export const selectShowAllSimilarities = (state: RootState) =>
    state.similarities.topk <= 0;
export const selectMinSimilarity = (state: RootState) =>
    state.similarities.minSimilarity;
export const selectMaxSimilarity = (state: RootState) =>
    state.similarities.maxSimilarity;
export const selectTopKSliceEnd = (state: RootState) => state.similarities.topk;
export const selectConfusionsMap = (state: RootState) =>
    state.similarities.confusionsMap;

export default similaritiesSlice.reducer;
