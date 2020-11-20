import { ReactNode } from 'react';
import { List } from 'immutable';

export interface EditableColumnMetadata {
    placeholder?: string;
    readOnly?: boolean;
    toolTip?: ReactNode;
    filteredLookupValues?: List<string>;
    filteredLookupKeys?: List<any>;
}

export interface IParsePastePayload {
    data: List<List<string>>;
    numCols: number;
    numRows: number;
}

export interface IPasteModel {
    message?: string;
    coordinates: {
        colMax: number;
        colMin: number;
        rowMax: number;
        rowMin: number;
    };
    payload: IParsePastePayload;
    rowsToAdd: number;
    success: boolean;
}
