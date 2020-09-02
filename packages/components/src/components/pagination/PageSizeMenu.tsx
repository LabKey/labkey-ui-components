import React, { PureComponent, ReactNode } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { blurActiveElement } from '../../util/utils';
import { Tip } from '../..';

interface PageSizeMenuProps {
    disabled: boolean;
    id: string;
    pageSize: number;
    pageSizes: number[];
    setPageSize: (size: number) => void;
}

export class PageSizeMenu extends PureComponent<PageSizeMenuProps> {
    setPageSize = (size): void => {
        this.props.setPageSize(size);
        blurActiveElement();
    };

    render(): ReactNode {
        const { disabled, id, pageSize, pageSizes } = this.props;
        const menuItems = pageSizes.map(size => (
            // eslint-disable-next-line react/jsx-no-bind
            <MenuItem key={size} active={size === pageSize} onClick={() => this.setPageSize(size)}>
                {size}
            </MenuItem>
        ));

        return (
            <div className="page-size-menu">
                <Tip caption="Page Size" trigger={['hover']}>
                    <DropdownButton
                        className="page-size-dropdown"
                        id={`page-size-drop-${id}`}
                        pullRight
                        title={pageSize}
                        disabled={disabled}
                    >
                        <MenuItem header>Page Size</MenuItem>

                        {menuItems}
                    </DropdownButton>
                </Tip>
            </div>
        );
    }
}
