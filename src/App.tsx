import Options from './Options';
import AddText from './AddText';
import Tsne from './Tsne';
import ConfusionMatrices from './ConfusionMatrices';
import Texts from './Texts';
import FilterClips from './FilterClips';
import Clips from './Clips';
import LoadingIndicator from './LoadingIndicator';
import Roc from './Roc';

function App() {
    return (
        <div className="App">
            <Options />
            <AddText />
            <Tsne />

            <LoadingIndicator />

            <div style={{
                display: 'flex',
                flexDirection: 'row',
            }}>
                <Roc />
                <ConfusionMatrices />
            </div>
            <Texts />
            <FilterClips />
            <Clips />
        </div>
    );
}

export default App;
