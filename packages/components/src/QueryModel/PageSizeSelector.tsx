import React, { PureComponent } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { Tip } from '..';

import { RequiresModelAndActions } from './withQueryModels';

interface PageSizeSelectorProps extends RequiresModelAndActions {
    // pageSizes is expected to be sorted (ascending)
    pageSizes?: number[];
}

export class PageSizeSelector extends PureComponent<PageSizeSelectorProps> {
    static defaultProps = {
        pageSizes: [20, 40, 100, 250, 400],
    };

    render() {
        const { model, actions, pageSizes } = this.props;
        const { id, error, maxRows } = model;
        const disabled = error !== undefined || model.isLoading;
        const show = model.rowCount > pageSizes[0];
        const menuItems = pageSizes.map(size => (
            <MenuItem key={size} active={size === maxRows} onClick={() => actions.setMaxRows(id, size)}>
                {size}
            </MenuItem>
        ));

        return (
            show && (
                <div className="page-size-selector">
                    <Tip caption="Page Size" trigger={['hover']}>
                        <DropdownButton id={`page-size-drop-${model.id}`} pullRight title={maxRows} disabled={disabled}>
                            <MenuItem header>Page Size</MenuItem>

                            {menuItems}
                        </DropdownButton>
                    </Tip>
                </div>
            )
        );
    }
}
