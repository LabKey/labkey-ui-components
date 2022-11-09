import React, { ReactNode, FC, memo } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

interface Props {
    body: ReactNode;
    iconCls?: string;
    id: string;
    title: string;
    unlocked?: boolean;
}

export const LockIcon: FC<Props> = memo(({ id, title, iconCls, body, unlocked = false }) => {
    return (
        <OverlayTrigger
            placement="bottom"
            overlay={
                <Popover id={id} title={title}>
                    {body}
                </Popover>
            }
        >
            <span className={'domain-field-lock-icon' + (iconCls ? ' ' + iconCls : '')}>
                <span className={`fa fa-${unlocked ? 'unlock' : 'lock'}`} />
            </span>
        </OverlayTrigger>
    );
});
