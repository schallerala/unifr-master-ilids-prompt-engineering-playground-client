import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import { TextClassification } from '../types';

interface TextsState {
    list: TextClassification[];
}

const initialState: TextsState = {
    list: []
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
                { text: payload.text, classification: payload.classification }
            ];
        },
        setTexts: (
            state,
            {
                payload
            }: PayloadAction<{ text: string; classification: boolean }[]>
        ) => {
            state.list = payload;
        },
        removeText: (state, { payload }: PayloadAction<string>) => {
            state.list = state.list.slice().filter((t) => t.text !== payload);
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
            ];
        });
    }
});

// Action creators are generated for each case reducer function
export const { addText, setTexts, removeText, toggleTextClassification } =
    textsSlice.actions;

export const selectTexts = (state: RootState) =>
    state.texts.list.slice().sort((a, b) => a.text.localeCompare(b.text));

export default textsSlice.reducer;
