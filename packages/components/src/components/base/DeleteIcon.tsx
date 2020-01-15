import React from 'react';

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
                <i className={'fa fa-times-circle field-delete'}/>
            </span>
        )
    }
}
