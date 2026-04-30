import React, { FC, memo } from 'react';

import { Tip } from '../../internal/components/base/Tip';
import { IconWithSrText } from '../../internal/dropdowns';

interface Props {
    iconOnly?: boolean;
    onFilter: () => void;
}

export const FiltersButton: FC<Props> = memo(props => {
    const { onFilter, iconOnly } = props;

    if (iconOnly) {
        return (
            <Tip caption="Filters">
                <button className="grid-panel__button btn btn-default" onClick={onFilter} type="button">
                    <IconWithSrText iconClass="fa fa-filter" srText="Filters" />
                </button>
            </Tip>
        );
    }

    return (
        <button className="grid-panel__button btn btn-default" onClick={onFilter}>
            <IconWithSrText iconClass="fa fa-filter" srText="Filters" /> Filters
        </button>
    );
});
FiltersButton.displayName = 'FiltersButton';
