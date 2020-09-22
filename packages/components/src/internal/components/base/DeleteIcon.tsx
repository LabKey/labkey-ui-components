import React from 'react';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Props {
    id?: string;
    iconCls?: string;
    onDelete: (event) => void;
    title?: string;
}

export class DeleteIcon extends React.Component<Props, any> {
    static defaultProperties = {
        iconCls: 'field-delete',
        title: 'Delete this item',
    };

    render() {
        const { id, title, onDelete, iconCls } = this.props;
        return (
            <span id={id} title={title} className="field-icon" onClick={onDelete}>
                <FontAwesomeIcon className={iconCls} icon={faTimesCircle} />
            </span>
        );
    }
}
