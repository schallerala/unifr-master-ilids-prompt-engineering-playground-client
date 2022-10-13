import Options from './Options';
import AddText from './AddText';
import Tsne from './Tsne';
import ConfusionMatrices from './ConfusionMatrices';
import Texts from './Texts';
import FilterClips from './FilterClips';
import Clips from './Clips';
import LoadingIndicator from './LoadingIndicator';

function App() {
    return (
        <div className="App">
            <Options />
            <AddText />
            <Tsne />

            <LoadingIndicator />

            <ConfusionMatrices />
            <Texts />
            <FilterClips />
            <Clips />
        </div>
    );
}

export default App;
