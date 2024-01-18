import React, { FC } from 'react';

import { createPortal } from 'react-dom';

import { DropdownButton, MenuDivider, MenuHeader, MenuItem } from '../../dropdowns';
import { useOverlayTriggerState } from '../../OverlayTrigger';
import { Tooltip } from '../../Tooltip';

interface Props {
    currentPage: number;
    disabled: boolean;
    isFirstPage: boolean;
    isLastPage: boolean;
    loadFirstPage: () => void;
    loadLastPage: () => void;
    pageCount: number;
    pageSize: number;
    pageSizes: number[];
    setPageSize: (size: number) => void;
}

export const PageMenu: FC<Props> = props => {
    const {
        currentPage,
        disabled,
        isFirstPage,
        isLastPage,
        loadFirstPage,
        loadLastPage,
        pageCount,
        pageSize,
        pageSizes,
        setPageSize,
    } = props;
    const totalPagesText = disabled ? '...' : `${pageCount} Total Pages`;
    // We have to manually wire up a Tooltip here because we're rendering PageMenu within a btn-group so any extra
    // wrapping elements cause it to render incorrectly.
    const { onMouseEnter, onMouseOut, portalEl, show, targetRef } = useOverlayTriggerState<HTMLDivElement>(
        'page-menu-overlay',
        true,
        false,
        200
    );
    const tooltip = (
        <Tooltip id="view-menu-tooltip" placement="top" targetRef={targetRef}>
            Current Page
        </Tooltip>
    );

    return (
        <DropdownButton
            className="current-page-dropdown"
            disabled={disabled}
            pullRight
            onMouseEnter={onMouseEnter}
            onMouseOut={onMouseOut}
            title={currentPage}
            ref={targetRef}
        >
            <MenuHeader text="Jump To" />
            <MenuItem disabled={disabled || isFirstPage} onClick={loadFirstPage}>
                First Page
            </MenuItem>
            <MenuItem disabled={disabled || isLastPage} onClick={loadLastPage}>
                Last Page
            </MenuItem>
            <MenuHeader className="submenu-footer" text={totalPagesText} />
            <MenuDivider />
            <MenuHeader text="Page Size" />
            {pageSizes?.map(size => (
                <MenuItem key={size} active={size === pageSize} onClick={() => setPageSize(size)}>
                    {size}
                </MenuItem>
            ))}
            {show && createPortal(tooltip, portalEl)}
        </DropdownButton>
    );
};
