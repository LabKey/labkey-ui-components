import React, { FC, memo } from 'react';

import { Tip } from '../../internal/components/base/Tip';

interface Props {
    onFilter: () => void;
    iconOnly?: boolean;
}

export const FiltersButton: FC<Props> = memo(props => {
    const { onFilter, iconOnly } = props;

    if (iconOnly) {
        return (
            <Tip caption="Filters" trigger={['hover']}>
                <button className="grid-panel__button btn btn-default" onClick={onFilter} type="button">
                    <i className="fa fa-filter" />
                </button>
            </Tip>
        );
    }

    return (
        <button className="grid-panel__button btn btn-default" onClick={onFilter} type="button">
            <i className="fa fa-filter" /> Filters
        </button>
    );
});
