import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from './store';
import { API_BASE_URL } from '../contants';
import { LinearizedTextClassification } from '../types';

export interface TsneCategory {
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

export const fetchTsneImages = createAsyncThunk(
    'tsnes/fetchImages',
    async (modelVariation: string) => {
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
);

type FetchTsneTextsProps = {
    texts: LinearizedTextClassification;
};

export const fetchTsneTexts = createAsyncThunk(
    'tsnes/fetchTexts',
    async ({ texts: [texts, classifications] }: FetchTsneTextsProps) => {
        if (texts.length <= 5) return Promise.resolve([]);

        const response = await fetch(API_BASE_URL + '/tsne-texts', {
            method: 'POST',
            body: JSON.stringify({
                texts,
                classifications
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
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
);

interface TsneState {
    imageTsneLoading: boolean;
    imageTsne: TsneCategory[];
    textTsneLoading: boolean;
    textTsne: TsneCategory[];
}

const initialState: TsneState = {
    imageTsneLoading: false,
    imageTsne: [],
    textTsneLoading: false,
    textTsne: []
};

export const tsnesSlice = createSlice({
    name: 'tsnes',
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder
            .addCase(fetchTsneImages.pending, (state, action) => {
                state.imageTsneLoading = true;
            })
            .addCase(fetchTsneImages.fulfilled, (state, action) => {
                state.imageTsneLoading = false;
                state.imageTsne = action.payload;
            })
            .addCase(fetchTsneTexts.pending, (state, action) => {
                state.textTsneLoading = true;
            })
            .addCase(fetchTsneTexts.fulfilled, (state, action) => {
                state.textTsneLoading = false;
                state.textTsne = action.payload;
            });
    }
});

// Action creators are generated for each case reducer function
export const {
    /* increment */
} = tsnesSlice.actions;

export const selectTsneLoadingImages = (state: RootState) =>
    state.tsnes.imageTsneLoading;
export const selectTsneImages = (state: RootState) => state.tsnes.imageTsne;
export const selectTsneImagesPlotlyData = (state: RootState) =>
    transformTsneResponseToPlotly(state.tsnes.imageTsne);
export const selectTsneLoadingTexts = (state: RootState) =>
    state.tsnes.textTsneLoading;
export const selectTsneTexts = (state: RootState) => state.tsnes.textTsne;
export const selectTsneTextsPlotlyData = (state: RootState) =>
    transformTsneResponseToPlotly(state.tsnes.textTsne);

export default tsnesSlice.reducer;

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
