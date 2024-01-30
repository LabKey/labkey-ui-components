import React, { FC, memo, ReactNode } from 'react';

import { createPortal } from 'react-dom';

import { useOverlayTriggerState } from '../../OverlayTrigger';
import { MenuItem } from '../../dropdowns';
import { Popover } from '../../Popover';
import { Placement } from '../../useOverlayPositioning';

interface Props {
    className?: string;
    disabledMessage?: ReactNode;
    href?: string;
    onClick?: () => void;
    operationPermitted: boolean;
    placement?: Placement;
}

const SAMPLE_OPERATION_NOT_PERMITTED_MESSAGE = 'The current status of the sample does not permit this operation.';

export const DisableableMenuItem: FC<Props> = memo(props => {
    const {
        children,
        className,
        disabledMessage = SAMPLE_OPERATION_NOT_PERMITTED_MESSAGE,
        operationPermitted,
        onClick,
        placement = 'left',
    } = props;
    const { onMouseEnter, onMouseLeave, portalEl, show, targetRef } = useOverlayTriggerState<HTMLLIElement>(
        'disableable-menu-item',
        true,
        false
    );

    if (operationPermitted) {
        return (
            <MenuItem className={className} onClick={onClick}>
                {children}
            </MenuItem>
        );
    }

    const overlay = (
        <Popover id="disable-operation-warning" className="popover-message" placement={placement} targetRef={targetRef}>
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
