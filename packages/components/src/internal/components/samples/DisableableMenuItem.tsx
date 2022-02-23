import React, { FC, memo, ReactNode } from 'react';
import { MenuItem, OverlayTrigger, Popover } from 'react-bootstrap';

import { ReactBootstrapMenuItemProps } from '../menus/types';

interface Props extends ReactBootstrapMenuItemProps {
    disabledMessage?: ReactNode;
    operationPermitted: boolean;
    placement?: string;
}

const SAMPLE_OPERATION_NOT_PERMITTED_MESSAGE = 'The current status of the sample does not permit this operation.';

export const DisableableMenuItem: FC<Props> = memo(props => {
    const {
        children,
        disabledMessage = SAMPLE_OPERATION_NOT_PERMITTED_MESSAGE,
        operationPermitted,
        placement = 'left',
        ...menuItemProps
    } = props;

    if (operationPermitted) {
        return <MenuItem {...menuItemProps}>{children}</MenuItem>;
    }

    const overlay = (
        <Popover id="disable-operation-warning" className="popover-message">
            {disabledMessage}
        </Popover>
    );

    return (
        <OverlayTrigger overlay={overlay} placement={placement}>
            <MenuItem disabled>{children}</MenuItem>
        </OverlayTrigger>
    );
});
