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

export const customStyles = {
    control: provided => ({
        ...provided,
        minHeight: 24,
        borderRadius: 0,
    }),
    valueContainer: provided => ({
        ...provided,
        minHeight: 24,
        padding: '0 4px',
    }),
    input: provided => ({
        ...provided,
        margin: '0px',
    }),
    indicatorsContainer: provided => ({
        ...provided,
        minHeight: 24,
        padding: '0 4px',
    }),
};

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

export const customTheme = theme => ({
    ...theme,
    colors: {
        ...theme.colors,
        danger: '#D9534F',
        primary: '#2980B9',
        primary75: '#009BF9',
        primary50: '#F2F9FC',
        primary25: 'rgba(41, 128, 185, 0.1)',
    },
    spacing: {
        ...theme.spacing,
        baseUnit: 2,
    },
});
