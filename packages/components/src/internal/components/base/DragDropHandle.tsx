import React from 'react';
import classNames from 'classnames';

interface Props {
    highlighted: boolean;
}

export class DragDropHandle extends React.Component<Props, any> {
    render() {
        const { highlighted } = this.props;
        const className = classNames('drag-drop-handle', {
            'field-highlighted': highlighted,
        });

        return (
            <div className={className}>
                <span className="fa fa-ellipsis-v" />
                <span className="fa fa-ellipsis-v" />
            </div>
        );
    }
}
