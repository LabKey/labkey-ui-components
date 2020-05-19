import React, { PureComponent, ReactNode } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { Tip } from '..';

import { blurActiveElement } from '../util/utils';

import { RequiresModelAndActions } from './withQueryModels';

interface PageSizeMenuProps extends RequiresModelAndActions {
    // pageSizes is expected to be sorted (ascending)
    pageSizes?: number[];
}

export class PageSizeMenu extends PureComponent<PageSizeMenuProps> {
    static defaultProps = {
        pageSizes: [20, 40, 100, 250, 400],
    };

    setMaxRows = (size): void => {
        const { model, actions } = this.props;
        actions.setMaxRows(model.id, size);
        blurActiveElement();
    };

    render(): ReactNode {
        const { model, pageSizes } = this.props;
        const { id, rowsError, maxRows, isLoading, rowCount } = model;
        const disabled = rowsError !== undefined || isLoading;
        const show = rowCount > pageSizes[0];
        const menuItems = pageSizes.map(size => (
            // eslint-disable-next-line react/jsx-no-bind
            <MenuItem key={size} active={size === maxRows} onClick={() => this.setMaxRows(size)}>
                {size}
            </MenuItem>
        ));

        return (
            show && (
                <div className="page-size-menu">
                    <Tip caption="Page Size" trigger={['hover']}>
                        <DropdownButton id={`page-size-drop-${id}`} pullRight title={maxRows} disabled={disabled}>
                            <MenuItem header>Page Size</MenuItem>

                            {menuItems}
                        </DropdownButton>
                    </Tip>
                </div>
            )
        );
    }
}
