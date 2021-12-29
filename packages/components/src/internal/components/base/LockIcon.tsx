import React, { ReactNode, PureComponent } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { faLock, faUnlock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Props {
    id: string;
    iconCls?: string;
    title: string;
    body: ReactNode;
    unlocked?: boolean;
}

export class LockIcon extends PureComponent<Props> {
    render() {
        const { id, title, iconCls, body, unlocked = false } = this.props;
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
                    <FontAwesomeIcon icon={unlocked ? faUnlock : faLock} />
                </span>
            </OverlayTrigger>
        );
    }
}
