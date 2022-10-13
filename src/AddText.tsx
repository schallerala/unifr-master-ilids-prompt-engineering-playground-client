import { useState } from 'react';
import { useAppDispatch } from './app/hooks';
import { addText, addTextAsync } from './app/textsSlice';

export default function AddText() {
    /**
     * Use to set the classification of the new text
     */
    const [isPositive, setPositive] = useState<boolean>(true);
    const [inputText, setInputText] = useState<string>('');

    const dispatch = useAppDispatch();

    return (
        <div
            className="top"
            style={{
                fontSize: '40px',
                display: 'flex',
                justifyContent: 'center',
                margin: '6px auto 0 auto'
            }}
        >
            <input
                style={{
                    width: '700px',
                    height: '72px',
                    fontSize: '40px'
                }}
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                onKeyUp={(event) => {
                    if (event.key === 'Enter') {
                        dispatch(
                            addTextAsync({
                                text: inputText,
                                classification: isPositive
                            })
                        );
                        setInputText('');
                    }
                }}
            />
            <span
                onClick={() => setPositive(!isPositive)}
                style={{
                    margin: '0 6px',
                    padding: '7px 12px 12px',
                    border: '1px solid Gray',
                    borderRadius: '4px'
                }}
            >
                {isPositive ? '+' : '-'}
            </span>
        </div>
    );
}
