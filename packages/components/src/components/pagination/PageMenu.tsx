import React, { PureComponent, ReactNode } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { blurActiveElement } from '../../util/utils';
import { Tip } from '../..';

interface PageSelectorProps {
    currentPage: number;
    disabled: boolean;
    id: string;
    isFirstPage: boolean;
    isLastPage: boolean;
    loadFirstPage: () => void;
    loadLastPage: () => void;
    pageCount: number;
}

export class PageMenu extends PureComponent<PageSelectorProps> {
    loadFirstPage = (): void => {
        this.props.loadFirstPage();
        blurActiveElement();
    };

    loadLastPage = (): void => {
        this.props.loadLastPage();
        blurActiveElement();
    };

    render(): ReactNode {
        const { currentPage, disabled, id, isFirstPage, isLastPage, pageCount } = this.props;

        return (
            <Tip caption="Current Page" trigger={['hover']}>
                <DropdownButton disabled={disabled} id={`current-page-drop-${id}`} pullRight title={currentPage}>
                    <MenuItem header>Jump To</MenuItem>

                    <MenuItem disabled={disabled || isFirstPage} onClick={this.loadFirstPage}>
                        First Page
                    </MenuItem>

                    <MenuItem disabled={disabled || isLastPage} onClick={this.loadLastPage}>
                        Last Page
                    </MenuItem>

                    <MenuItem header>{disabled ? '...' : pageCount} Total Pages</MenuItem>
                </DropdownButton>
            </Tip>
        );
    }
}
