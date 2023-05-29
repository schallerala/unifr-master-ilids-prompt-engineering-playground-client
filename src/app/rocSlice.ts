import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_BASE_URL } from "../contants";
import { LinearizedTextClassification } from "../types";
import { RootState } from "./store";

export interface RocResponse {
    fpr: number[];
    tpr: number[];
    thresholds: number[];
    auc: number;
}

type FetchProps = {
    texts: LinearizedTextClassification;
    modelVariation: string;
}

let lastRocAbortController: AbortController | undefined = undefined;

export const fetchRoc = createAsyncThunk(
    'roc/fetch',
    async ({
        texts: [texts, classifications],
        modelVariation
    }: FetchProps) => {
        if (lastRocAbortController) {
            console.log('Stopping previous fetch');
            lastRocAbortController.abort();
        }

        lastRocAbortController = new AbortController();

        const response = await fetch(API_BASE_URL + `/roc-auc`, {
            method: 'POST',
            body: JSON.stringify({
                model_variation: modelVariation,
                texts,
                classifications
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            signal: lastRocAbortController.signal
        });

        lastRocAbortController = undefined;

        if (!response.ok) return Promise.reject(response);

        const json = await response.json();
        return json as RocResponse;
    }
);

interface RocState {
    loading: boolean;
    data: RocResponse | null;
}

const initialState: RocState = {
    loading: false,
    data: null
};

export const rocSlice = createSlice({
    name: 'roc',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchRoc.pending, (state, action) => {
                state.loading = true;
            })
            .addCase(fetchRoc.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
    }
});

export const selectRoc = (state: RootState) => state.roc;
export const selectRocLoading = (state: RootState) => state.roc.loading;

export default rocSlice.reducer;