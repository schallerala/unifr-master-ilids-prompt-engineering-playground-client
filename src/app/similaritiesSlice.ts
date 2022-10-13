import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from './store';
import { API_BASE_URL } from '../contants';
import {
    ClipSimilarity,
    ConfusionTopK,
    LinearizedTextClassification
} from '../types';
import { group } from 'radash';

export interface SimilarityResponse {
    similarities: { [key: string]: ClipSimilarity[] };
    confusion: { [key: number]: ConfusionTopK };
}

type FetchProps = {
    texts: LinearizedTextClassification;
    modelVariation: string;
    textClassification: string;
};

export const fetchSimilarities = createAsyncThunk(
    'similarities/fetch',
    async ({
        texts: [texts, classifications],
        modelVariation,
        textClassification
    }: FetchProps) => {
        const response = await fetch(API_BASE_URL + `/similarity`, {
            method: 'POST',
            body: JSON.stringify({
                model_variation: modelVariation,
                text_classification_method: textClassification,
                texts,
                classifications
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) return Promise.reject(response);

        const responseObj = await response.json();

        return responseObj;
    }
);

type TopK = -1 | 6;

interface SimilaritiesState {
    loading: boolean;
    similaritiesMap: { [key: string]: ClipSimilarity[] };
    confusionsMap: { [key: number]: ConfusionTopK };
    topk: TopK;
}

const initialState: SimilaritiesState = {
    loading: false,
    similaritiesMap: {},
    confusionsMap: {},
    topk: 6
};

export const similaritiesSlice = createSlice({
    name: 'similarities',
    initialState,
    reducers: {
        toggleShowAllSimilarities: (state) => {
            state.topk = state.topk === -1 ? 6 : -1;
        }
    },
    extraReducers(builder) {
        builder
            .addCase(fetchSimilarities.pending, (state, action) => {
                state.loading = true;
            })
            .addCase(fetchSimilarities.fulfilled, (state, action) => {
                state.loading = false;
                state.similaritiesMap = action.payload.similarities;
                state.confusionsMap = action.payload.confusion;
            });
    }
});

// Action creators are generated for each case reducer function
export const { toggleShowAllSimilarities } = similaritiesSlice.actions;

export const selectSimilaritiesLoading = (state: RootState) =>
    state.similarities.loading;
export const selectSimilaritiesMap = (state: RootState) =>
    state.similarities.similaritiesMap;
export const selectShowAllSimilarities = (state: RootState) =>
    state.similarities.topk <= 0;
export const selectTopKSliceEnd = (state: RootState) => state.similarities.topk;
// export const selectTopKClipsSimilarities = (state: RootState) => {
//     return state.similarities;

//     // const orderedSimilarities = group(
//     //     Object.entries(similaritiesMap)
//     //         .flatMap(([clip, similarities]) =>
//     //             similarities.map(({ text, classification, similarity }) => ({
//     //                 clip,
//     //                 text,
//     //                 classification,
//     //                 similarity
//     //             }))
//     //         )
//     //         .sort((a, b) => -(a.similarity - b.similarity)),
//     //     (flatSimilarity) => flatSimilarity.clip
//     // );

//     // const slicedMap = new Map(
//     //     Object.entries(orderedSimilarities).map(([clip, similarities]) => [
//     //         clip,
//     //         similarities.slice(0, sliceEnd)
//     //     ])
//     // );

//     return {} as typeof similaritiesMap;
// };
export const selectConfusionsMap = (state: RootState) =>
    state.similarities.confusionsMap;

export default similaritiesSlice.reducer;
