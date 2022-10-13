import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import { API_BASE_URL } from '../contants';
import { ClipIndex } from '../types';

export const fetchClips = createAsyncThunk('clips/fetch', async () => {
    const response = await fetch(API_BASE_URL + '/images');
    if (!response.ok) return Promise.reject(response);

    const responseObj = await response.json();
    return responseObj.index.map((clip: string, i: number) => ({
        index: clip,
        category: responseObj.categories[i],
        isAlarm: responseObj.categories[i] === 'Alarm',
        distance: responseObj.distances[i],
        approach: responseObj.approaches[i],
        description: responseObj.descriptions[i]
    }));
});

export const fetchPlayClip = createAsyncThunk(
    'clips/playClip',
    async (clip: string) => {
        const response = await fetch(API_BASE_URL + `/play/${clip}`, {
            method: 'POST'
        });
        if (!response.ok) return Promise.reject(response);
    }
);

interface ClipsState {
    loading: boolean;
    list: ClipIndex[];
    filtering: {
        showAlarms: boolean;
        showNotAlarms: boolean;
        showOnlyWrongTopK: number[];
    };
}

const initialState: ClipsState = {
    loading: false,
    list: [],
    filtering: {
        showAlarms: true,
        showNotAlarms: true,
        showOnlyWrongTopK: []
    }
};

export const clipsSlice = createSlice({
    name: 'clips',
    initialState,
    reducers: {
        toggleShowAlarms: (state) => {
            const { showAlarms } = state.filtering;
            state.filtering = {
                ...state.filtering,
                showAlarms: !showAlarms
            };
        },
        toggleShowNotAlarms: (state) => {
            const { showNotAlarms } = state.filtering;
            state.filtering = {
                ...state.filtering,
                showNotAlarms: !showNotAlarms
            };
        },
        toggleShowOnlyWrongTopK: (
            state,
            { payload }: PayloadAction<number>
        ) => {
            const { showOnlyWrongTopK } = state.filtering;

            state.filtering = {
                ...state.filtering,
                showOnlyWrongTopK: showOnlyWrongTopK.includes(payload)
                    ? showOnlyWrongTopK.filter((v) => v !== payload)
                    : [...showOnlyWrongTopK, payload]
            };
        }
    },
    extraReducers(builder) {
        builder
            .addCase(fetchClips.pending, (state, action) => {
                state.loading = true;
            })
            .addCase(fetchClips.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            });
    }
});

// Action creators are generated for each case reducer function
export const {
    toggleShowAlarms,
    toggleShowNotAlarms,
    toggleShowOnlyWrongTopK
} = clipsSlice.actions;

export const selectClipsLoading = (state: RootState) => state.clips.loading;
export const selectClips = (state: RootState) => state.clips.list;
export const selectFilteredClipsByCategory = (state: RootState) => {
    const {
        list,
        filtering: { showAlarms, showNotAlarms }
    } = state.clips;

    const filtered = list.filter(
        filterClipsByCategory(showAlarms, showNotAlarms)
    );

    return filtered;
};
export const selectClipsFiltering = (state: RootState) => state.clips.filtering;

export default clipsSlice.reducer;

function filterClipsByCategory(
    showAlarms: boolean,
    showNotAlarms: boolean
): (i: ClipIndex) => boolean {
    return ({ isAlarm }: ClipIndex) => {
        if (isAlarm) return showAlarms;
        else return showNotAlarms;
    };
}
