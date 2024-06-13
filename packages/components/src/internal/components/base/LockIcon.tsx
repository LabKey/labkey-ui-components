import React, { ReactNode, FC, memo } from 'react';

import { OverlayTrigger } from '../../OverlayTrigger';
import { Popover } from '../../Popover';
import { Placement } from '../../useOverlayPositioning';

interface Props {
    body: ReactNode;
    className?: string;
    iconCls?: string;
    id: string;
    placement?: Placement;
    title: string;
    unlocked?: boolean;
}

export const LockIcon: FC<Props> = memo(
    ({ id, title, iconCls, body, className, unlocked = false, placement = 'bottom' }) => {
        return (
            <OverlayTrigger
                className={className}
                overlay={
                    <Popover id={id} title={title} placement={placement}>
                        {body}
                    </Popover>
                }
            >
                <span className={'domain-field-lock-icon' + (iconCls ? ' ' + iconCls : '')}>
                    <span className={`fa fa-${unlocked ? 'unlock' : 'lock'}`} />
                </span>
            </OverlayTrigger>
        );
    }
);
