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
            <Tip caption="Filters">
                <a className="grid-panel__button btn btn-default" onClick={onFilter}>
                    <i className="fa fa-filter" />
                </a>
            </Tip>
        );
    }

    return (
        <a className="grid-panel__button btn btn-default" onClick={onFilter}>
            <i className="fa fa-filter" /> Filters
        </a>
    );
});
