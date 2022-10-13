export interface PLotlyDataLayout {
    data: Plotly.Data[];
    layout: Partial<Plotly.Layout>;
}

export interface ClipSimilarity {
    text: string;
    classification: boolean;
    similarity: number; // [0, 1]
}

export interface ConfusionTopK {
    tp: number;
    fn: number;
    fp: number;
    tn: number;
    topk_text_classification: { [key: string]: boolean };
}

export interface ClipIndex {
    index: string;
    category: string;
    isAlarm: boolean;
    distance?: number;
    approach?: string;
    description?: string;
}

export interface TextClassification {
    text: string;
    classification: boolean;
}

export type LinearizedTextClassification = [string[], boolean[]];
