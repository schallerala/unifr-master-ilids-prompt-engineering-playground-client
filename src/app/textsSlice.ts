import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import { TextClassification } from '../types';
import { text } from 'stream/consumers';

interface TextsState {
    list: TextClassification[];
    subtractionsText: string | undefined;
}

const initialState: TextsState = {
    list: [],
    subtractionsText: undefined
};

type AddTextAsyncProp = { text: string; classification: boolean };

export const addTextAsync = createAsyncThunk(
    'texts/addTextAsync',
    async ({ text, classification }: AddTextAsyncProp) => {
        return new Promise<AddTextAsyncProp>((resolve) => {
            setTimeout(() => {
                resolve({ text, classification });
            }, 0);
        });
    }
);

export const textsSlice = createSlice({
    name: 'texts',
    initialState,
    reducers: {
        addText: (
            state,
            {
                payload
            }: PayloadAction<{ text: string; classification: boolean }>
        ) => {
            state.list = [
                ...state.list,
                {
                    text: payload.text.toLowerCase(),
                    classification: payload.classification
                }
            ]
                .sort((a, b) => a.text.localeCompare(b.text))
                .filter((t, i, ts) => i === 0 || t.text !== ts[i - 1].text);
        },
        setTexts: (
            state,
            {
                payload
            }: PayloadAction<{ text: string; classification: boolean }[]>
        ) => {
            state.list = payload
                .slice()
                .sort((a, b) => a.text.localeCompare(b.text))
                .map((t) => ({
                    text: t.text.toLowerCase(),
                    classification: t.classification
                }))
                .filter((t, i, ts) => i === 0 || t.text !== ts[i - 1].text);
        },
        removeText: (state, { payload }: PayloadAction<string>) => {
            state.list = state.list
                .slice()
                .filter((t) => t.text !== payload)
                .sort((a, b) => a.text.localeCompare(b.text));
        },
        toggleAllTo: (state, { payload }: PayloadAction<boolean>) => {
            state.list = state.list
                .slice()
                .map(({ text }) => ({ text, classification: payload }));
        },
        toggleTextClassification: (
            state,
            { payload }: PayloadAction<string>
        ) => {
            state.list = state.list
                .slice()
                .map(({ text, classification }) =>
                    text === payload
                        ? { text, classification: !classification }
                        : { text, classification }
                );
        },
        setSubtractionTexts: (state, { payload }: PayloadAction<string>) => {
            state.subtractionsText =
                payload && payload.length ? payload : undefined;
        }
    },
    extraReducers(builder) {
        builder.addCase(addTextAsync.fulfilled, (state, action) => {
            state.list = [
                ...state.list,
                {
                    text: action.payload.text,
                    classification: action.payload.classification
                }
            ]
                .sort((a, b) => a.text.localeCompare(b.text))
                .filter((t, i, ts) => i === 0 || t.text !== ts[i - 1].text);
        });
    }
});

// Action creators are generated for each case reducer function
export const {
    addText,
    setTexts,
    removeText,
    toggleTextClassification,
    setSubtractionTexts,
    toggleAllTo
} = textsSlice.actions;

export const selectTexts = (state: RootState) => state.texts.list;

export const selectSubtractionTexts = (state: RootState) => {
    return state.texts.subtractionsText;
};

export const selectTextsLength = (state: RootState) => state.texts.list.length;

export default textsSlice.reducer;
