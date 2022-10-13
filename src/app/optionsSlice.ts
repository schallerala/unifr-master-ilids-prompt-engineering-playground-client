import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import { API_BASE_URL } from '../contants';

export const fetchModelVariations = createAsyncThunk(
    'options/fetchModelVariations',
    async () => {
        const response = await fetch(API_BASE_URL + `/variations`);
        if (!response.ok) return Promise.reject(response);

        return await response.json();
    }
);
export const fetchTextClassificationMethods = createAsyncThunk(
    'options/fetchTextClassificationMethods',
    async () => {
        const response = await fetch(API_BASE_URL + `/text-classification`);
        if (!response.ok) return Promise.reject(response);

        return await response.json();
    }
);

interface OptionsState {
    loadingModelVariations: boolean;
    modelVariations: string[];
    selectedModelVariation?: string;

    loadingTextClassificationMethods: boolean;
    textClassificationMethods: string[];
    selectedTextClassificationMethod?: string;
}

const initialState: OptionsState = {
    loadingModelVariations: false,
    modelVariations: [],

    loadingTextClassificationMethods: false,
    textClassificationMethods: []
};

export const textsSlice = createSlice({
    name: 'texts',
    initialState,
    reducers: {
        selectModelVariation: (state, { payload }: PayloadAction<string>) => {
            state.selectedModelVariation = payload;
        },
        selectTextClassificationMethod: (
            state,
            { payload }: PayloadAction<string>
        ) => {
            state.selectedTextClassificationMethod = payload;
        }
    },
    extraReducers(builder) {
        builder
            .addCase(fetchModelVariations.pending, (state) => {
                state.loadingModelVariations = true;
            })
            .addCase(fetchModelVariations.fulfilled, (state, action) => {
                state.loadingModelVariations = false;
                state.modelVariations = action.payload;
            })
            .addCase(fetchTextClassificationMethods.pending, (state) => {
                state.loadingTextClassificationMethods = true;
            })
            .addCase(
                fetchTextClassificationMethods.fulfilled,
                (state, action) => {
                    state.loadingTextClassificationMethods = false;
                    state.textClassificationMethods = action.payload;
                }
            );
    }
});

// Action creators are generated for each case reducer function
export const { selectModelVariation, selectTextClassificationMethod } =
    textsSlice.actions;

export const selectLoadingModelVariations = (state: RootState) =>
    state.options.loadingModelVariations;
export const selectModelVariations = (state: RootState) =>
    state.options.modelVariations;
export const selectSelectedModelVariation = (state: RootState) =>
    state.options.selectedModelVariation;

export const selectLoadingTextClassificationMethods = (state: RootState) =>
    state.options.loadingTextClassificationMethods;
export const selectTextClassificationMethods = (state: RootState) =>
    state.options.textClassificationMethods;
export const selectSelectedTextClassificationMethod = (state: RootState) =>
    state.options.selectedTextClassificationMethod;

export default textsSlice.reducer;
