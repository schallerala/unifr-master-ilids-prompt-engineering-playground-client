import React from 'react';
import { useAppDispatch, useAppSelector } from './app/hooks';
import {
    selectClipsFiltering,
    toggleShowAlarms,
    toggleShowNotAlarms,
    toggleShowOnlyWrongTopK
} from './app/clipsSlice';
import {
    selectShowAllSimilarities,
    toggleShowAllSimilarities
} from './app/similaritiesSlice';

export default function FilterClips() {
    const dispatch = useAppDispatch();

    const { showAlarms, showNotAlarms, showOnlyWrongTopK } =
        useAppSelector(selectClipsFiltering);
    const showAllSimilarities = useAppSelector(selectShowAllSimilarities);

    return (
        <React.Fragment>
            <div>
                Show:
                <label>
                    <input
                        type="checkbox"
                        defaultChecked={showAlarms}
                        onChange={() => dispatch(toggleShowAlarms())}
                    />
                    Alarms
                </label>
                <label>
                    <input
                        type="checkbox"
                        defaultChecked={showNotAlarms}
                        onChange={() => dispatch(toggleShowNotAlarms())}
                    />
                    Not Alarms
                </label>
            </div>
            <div>
                Show only <b>wrong</b> TOP K:
                {[1, 3, 5].map((i) => {
                    const topKChecked = i in showOnlyWrongTopK;
                    return (
                        <label key={i}>
                            <input
                                type="checkbox"
                                defaultChecked={topKChecked}
                                onChange={() =>
                                    dispatch(toggleShowOnlyWrongTopK(i))
                                }
                            />
                            K = {i}
                        </label>
                    );
                })}
            </div>
            <div>
                Show:
                <label>
                    <input
                        type="checkbox"
                        defaultChecked={showAllSimilarities}
                        onChange={() => dispatch(toggleShowAllSimilarities())}
                    />
                    All similarities score
                </label>
            </div>
        </React.Fragment>
    );
}
