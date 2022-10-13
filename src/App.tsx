import Options from './Options';
import AddText from './AddText';
import Tsne from './Tsne';
import ConfusionMatrices from './ConfusionMatrices';
import Texts from './Texts';
import FilterClips from './FilterClips';
import Clips from './Clips';

function App() {
    //     setSimilarityLoading(true);
    //     querySimilarities(
    //         linearizeTextClassification(texts),
    //         selectedModelVariation,
    //         selectedTextClassificationMethod
    //     ).then(({ similarities, confusion }) => {
    //         setConfusionMap(confusion);
    //         setSimilarityMap(similarities);
    //         setSimilarityLoading(false);
    //     });
    //     setLocalText(texts);

    // }, [
    //     texts,
    //     setSimilarityLoading,
    //     setConfusionMap,
    //     setSimilarityMap,
    //     setLocalText,
    // ]);

    return (
        <div className="App">
            <Options />
            <AddText />
            <Tsne />

            {/* <h4
                style={{
                    textAlign: 'center',
                    visibility: similarityLoading ? 'visible' : 'hidden'
                }}
            >
                Loading...
            </h4> */}

            <ConfusionMatrices />
            <Texts />
            <FilterClips />
            <Clips />
        </div>
    );
}

export default App;
