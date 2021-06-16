import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Option } from 'react-select';

import { SelectInput, SelectInputProps } from '../../..';

const SELECT_VIEWS = '__select_views__';

// exported for jest testing
export function clearSelectViewsInLocalStorage(): void {
    localStorage.removeItem(SELECT_VIEWS);
}

// exported for jest testing
export function getSelectViewsInLocalStorage(): Record<string, string> {
    const selectedViews = localStorage.getItem(SELECT_VIEWS);

    if (selectedViews !== null) {
        return JSON.parse(selectedViews);
    }

    return {};
}

// exported for jest testing
export function setSelectViewInLocalStorage(id: string, value: string): void {
    const selectedViews = getSelectViewsInLocalStorage();

    if (value) {
        selectedViews[id] = value;
    } else {
        delete selectedViews[id];
    }

    localStorage.setItem(SELECT_VIEWS, JSON.stringify(selectedViews));
}

export enum SelectView {
    Cards = 'cards',
    Grid = 'grid',
    Heatmap = 'heatmap',
}

type ViewOption = Option | SelectView;

const ViewOptions = {
    [SelectView.Cards]: { label: 'Cards', value: SelectView.Cards },
    [SelectView.Grid]: { label: 'Grid', value: SelectView.Grid },
    [SelectView.Heatmap]: { label: 'Heatmap', value: SelectView.Heatmap },
};

const isSelectView = (value: ViewOption): value is SelectView => {
    return typeof value === 'string';
};

interface Props extends Omit<SelectInputProps, 'onChange' | 'options'> {
    id: string;
    onViewSelect: (view: ViewOption) => void;
    views: ViewOption[];
}

export const SelectViewInput: FC<Props> = memo(props => {
    const { id, onViewSelect, value, views, ...selectInputProps } = props;

    // When initializing the selectedView this component defers to the value in local storage over the provided value.
    // If a value is set in local storage, then this flag will be toggled resulting in a side-effect to inform
    // the user the selected view has been changed as they could be tracking this value as well.
    let initFromStorage = false;

    const [selectedView, setSelectedView] = useState(() => {
        const view = getSelectViewsInLocalStorage()[id];
        if (view && view !== value) {
            initFromStorage = true;
            return view;
        }
        return value;
    });

    useEffect(() => {
        if (initFromStorage) {
            onViewSelect(selectedView);
        }
    }, [initFromStorage]);

    const options = useMemo(() => {
        if (!views) return [];
        return views.map(view => (isSelectView(view) ? ViewOptions[view] : view));
    }, [views]);

    const onChange = useCallback(
        (_, _value) => {
            setSelectedView(_value);
            onViewSelect(_value);
            setSelectViewInLocalStorage(id, _value);
        },
        [id, onViewSelect]
    );

    return (
        <SelectInput
            clearable={false}
            formsy={false}
            inputClass="col-xs-4 col-md-2"
            multiple={false}
            name="select-view-input"
            placeholder="Select a view..."
            required={false}
            showLabel={false}
            {...selectInputProps}
            id={id}
            onChange={onChange}
            options={options}
            value={selectedView}
        />
    );
});
