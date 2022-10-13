import { LinearizedTextClassification, TextClassification } from './types';

export function linearizeTextClassification(
    texts: TextClassification[]
): LinearizedTextClassification {
    return [
        texts.map(({ text }) => text),
        texts.map(({ classification }) => classification)
    ];
}
