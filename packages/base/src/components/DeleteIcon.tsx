import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

interface Props {
    onDelete: (event) => void
    title?: string
}

export class DeleteIcon extends React.Component<Props, any> {

    static defaultProperties = {
        title: "Delete this item"
    };

    render() {
        const { title, onDelete } = this.props;
        return (
            <span title={title} className="field-icon" onClick={onDelete}>
                <FontAwesomeIcon size='sm' className={"field-delete"} icon={faTrash}/>
            </span>
        )
    }
}