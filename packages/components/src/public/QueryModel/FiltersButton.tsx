import React, { FC, memo } from 'react';
import { Button } from 'react-bootstrap';

import { Tip } from '../../internal/components/base/Tip';

interface Props {
    onFilter: () => void;
}

export const FiltersButton: FC<Props> = memo(props => {
    const { onFilter } = props;

    return (
        <>
            <span className="hidden-md hidden-sm hidden-xs">
                <Button className="grid-panel__button" onClick={onFilter}>
                    <i className="fa fa-filter" /> Filters
                </Button>
            </span>
            <span className="visible-md visible-sm visible-xs">
                <Tip caption="Filters" trigger={['hover']}>
                    <Button className="grid-panel__button" onClick={onFilter}>
                        <i className="fa fa-filter" />
                    </Button>
                </Tip>
            </span>
        </>
    );
});
