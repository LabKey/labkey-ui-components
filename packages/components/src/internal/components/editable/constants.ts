import { ValueDescriptor } from '../../models';
import { MODIFICATION_TYPES, SELECTION_TYPES } from '../../constants';

export const EDITABLE_GRID_CONTAINER_CLS = 'editable-grid__container';

export interface CellActions {
    clearSelection: () => void;
    fillDown: () => void;
    focusCell: (colIdx: number, rowIdx: number, clearValue?: boolean) => void;
    inDrag: () => boolean; // Not really an action, but useful to be part of this interface
    modifyCell: (colIdx: number, rowIdx: number, newValues: ValueDescriptor[], mod: MODIFICATION_TYPES) => void;
    selectCell: (colIdx: number, rowIdx: number, selection?: SELECTION_TYPES, resetValue?: boolean) => void;
}

// TODO: Figure out how to reincorporate this after investigating if it is still necessary
// Styles to match form-control in bulk form
export const customBulkStyles = {
    control: provided => ({
        ...provided,
        color: '#555555',
        border: '1px solid #ccc',
        borderRadius: '4px',
    }),
    singleValue: provided => ({
        ...provided,
        color: '#555555',
    }),
};
