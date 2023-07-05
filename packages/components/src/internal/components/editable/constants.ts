import { ValueDescriptor } from './models';

export const EDITABLE_GRID_CONTAINER_CLS = 'editable-grid__container';

export enum SELECTION_TYPES {
    ALL,
    AREA,
    SINGLE,
}

export enum MODIFICATION_TYPES {
    ADD,
    REPLACE,
    REMOVE,
    REMOVE_ALL,
}

export interface CellActions {
    clearSelection: () => void;
    fillDown: () => void;
    focusCell: (colIdx: number, rowIdx: number, clearValue?: boolean) => void;
    inDrag: () => boolean; // Not really an action, but useful to be part of this interface
    modifyCell: (colIdx: number, rowIdx: number, newValues: ValueDescriptor[], mod: MODIFICATION_TYPES) => void;
    selectCell: (colIdx: number, rowIdx: number, selection?: SELECTION_TYPES, resetValue?: boolean) => void;
}

export interface CellCoordinates {
    colIdx: number;
    rowIdx: number;
}
