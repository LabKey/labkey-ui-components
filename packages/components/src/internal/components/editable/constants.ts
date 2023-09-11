import { ValueDescriptor } from './models';

export const EDITABLE_GRID_CONTAINER_CLS = 'editable-grid__container';

export enum SELECTION_TYPES {
    ALL,
    AREA,
    SINGLE,
    // Different from AREA, because it involves expanding or contracting an existing selected area, instead of selecting
    // the area between two points.
    AREA_CHANGE,
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

export enum EditableGridEvent {
    ADD_ROWS = 'ADD_ROWS',
    BULK_ADD = 'BULK_ADD',
    BULK_UPDATE = 'BULK_UPDATE',
    CLEAR_SELECTION = 'CLEAR_SELECTION',
    DRAG_FILL = 'DRAG_FILL',
    FOCUS_CELL = 'FOCUS_CELL',
    MODIFY_CELL = 'MODIFY_CELL',
    PASTE = 'PASTE',
    REMOVE_ROWS = 'REMOVE_ROWS',
    SELECT_CELL = 'SELECT_CELL',
}
