import React, { FC, memo, ReactNode } from 'react';

import { createPortal } from 'react-dom';

import { useOverlayTriggerState } from '../../OverlayTrigger';
import { MenuItem } from '../../dropdowns';
import { Popover } from '../../Popover';
import { Placement } from '../../useOverlayPositioning';

export interface DisableableMenuItemProps {
    className?: string;
    disabled?: boolean;
    disabledMessage?: ReactNode;
    href?: string;
    onClick?: () => void;
    placement?: Placement;
}

const SAMPLE_OPERATION_NOT_PERMITTED_MESSAGE = 'The current status of the sample does not permit this operation.';

export const DisableableMenuItem: FC<DisableableMenuItemProps> = memo(props => {
    const {
        children,
        className,
        disabledMessage = SAMPLE_OPERATION_NOT_PERMITTED_MESSAGE,
        disabled = false,
        href,
        onClick,
        placement = 'left',
    } = props;
    const { onMouseEnter, onMouseLeave, portalEl, show, targetRef } = useOverlayTriggerState<HTMLLIElement>(
        'disableable-menu-item',
        true,
        false
    );

    if (!disabled) {
        return (
            <MenuItem className={className} href={href} onClick={onClick}>
                {children}
            </MenuItem>
        );
    }

    const overlay = (
        <Popover
            id="disable-operation-warning"
            className="disabled-menu-item-popover"
            placement={placement}
            targetRef={targetRef}
        >
            {disabledMessage}
        </Popover>
    );

    return (
        <MenuItem
            className={className}
            disabled
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            ref={targetRef}
        >
            {children}
            {show && createPortal(overlay, portalEl)}
        </MenuItem>
    );
});
DisableableMenuItem.displayName = 'DisableableMenuItem';
