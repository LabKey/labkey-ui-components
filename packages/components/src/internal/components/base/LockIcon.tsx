import React, { ReactNode, PureComponent } from 'react';
import { OverlayTrigger, Popover } from "react-bootstrap";
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Props {
    id: string;
    iconCls?: string;
    title: string;
    body: ReactNode;
}

export class LockIcon extends PureComponent<Props> {
    render() {
        const { id, title, iconCls, body } = this.props;
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
                    <FontAwesomeIcon icon={faLock} />
                </span>
            </OverlayTrigger>
        );
    }
}
