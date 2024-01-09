import React, { PureComponent, ReactNode } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { blurActiveElement } from '../../util/utils';
import { Tip } from '../base/Tip';

interface Props {
    currentPage: number;
    disabled: boolean;
    id: string;
    isFirstPage: boolean;
    isLastPage: boolean;
    loadFirstPage: () => void;
    loadLastPage: () => void;
    pageCount: number;
    pageSize: number;
    pageSizes: number[];
    setPageSize: (size: number) => void;
}

export class PageMenu extends PureComponent<Props> {
    loadFirstPage = (): void => {
        this.props.loadFirstPage();
        blurActiveElement();
    };

    loadLastPage = (): void => {
        this.props.loadLastPage();
        blurActiveElement();
    };

    setPageSize = (size: number): void => {
        this.props.setPageSize(size);
        blurActiveElement();
    };

    render(): ReactNode {
        const { currentPage, disabled, id, isFirstPage, isLastPage, pageCount, pageSize, pageSizes } = this.props;

        return (
            <Tip caption="Current Page">
                <DropdownButton
                    className="current-page-dropdown"
                    disabled={disabled}
                    id={`current-page-drop-${id}`}
                    pullRight
                    title={currentPage}
                >
                    <MenuItem header>Jump To</MenuItem>
                    <MenuItem disabled={disabled || isFirstPage} onClick={this.loadFirstPage}>
                        First Page
                    </MenuItem>
                    <MenuItem disabled={disabled || isLastPage} onClick={this.loadLastPage}>
                        Last Page
                    </MenuItem>
                    <MenuItem header className="submenu-footer">
                        {disabled ? '...' : `${pageCount} Total Pages`}
                    </MenuItem>
                    <MenuItem divider />
                    <MenuItem header>Page Size</MenuItem>
                    {pageSizes?.map(size => (
                        <MenuItem key={size} active={size === pageSize} onClick={() => this.setPageSize(size)}>
                            {size}
                        </MenuItem>
                    ))}
                </DropdownButton>
            </Tip>
        );
    }
}
