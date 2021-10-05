import React, { FC, memo, ReactNode } from 'react';
import { MenuItem, OverlayTrigger, Popover } from 'react-bootstrap';

interface Props {
    disabledMessage?: ReactNode
    operationPermitted: boolean,
    menuItemProps?: any,
    menuItemContent: ReactNode,
}

const OPERATION_NOT_PERMITTED_MESSAGE = "The current status of the sample does not permit this operation.";

export const SampleOperationMenuItem: FC<Props> = memo(props => {

    const { disabledMessage, operationPermitted, menuItemProps, menuItemContent } = props;

    if (operationPermitted)
        return <MenuItem {...menuItemProps}>{menuItemContent}</MenuItem>

    const overlay = (
        <Popover id="disable-operation-warning">
            {disabledMessage ?? OPERATION_NOT_PERMITTED_MESSAGE}
        </Popover>
    );
    return (
        <OverlayTrigger overlay={overlay} placement="left">
            <MenuItem disabled>{menuItemContent}</MenuItem>
        </OverlayTrigger>
    )
});

