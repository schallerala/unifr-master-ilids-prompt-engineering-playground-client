import { configureStore } from '@reduxjs/toolkit';
import clipsReducer from './clipsSlice';
import similaritiesReducer from './similaritiesSlice';
import tsnesReducer from './tsnesSlice';
import textsReducer from './textsSlice';
import optionsReducer from './optionsSlice';

const store = configureStore({
    reducer: {
        clips: clipsReducer,
        similarities: similaritiesReducer,
        tsnes: tsnesReducer,
        texts: textsReducer,
        options: optionsReducer
    }
});

export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
