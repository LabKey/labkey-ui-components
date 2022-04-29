import React, { FC, memo } from 'react';
import { Button } from 'react-bootstrap';

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
                <Button className="grid-panel__button" onClick={onFilter}>
                    <i className="fa fa-filter" />
                </Button>
            </Tip>
        );
    }

    return (
        <Button className="grid-panel__button" onClick={onFilter}>
            <i className="fa fa-filter" /> Filters
        </Button>
    );
});
