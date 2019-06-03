import * as React from 'react';

interface RemoveEntityButtonProps {
    entity?: string
    index?: number
    labelClass?: string
    onClick: () => void
}

export class RemoveEntityButton extends React.Component<RemoveEntityButtonProps, any> {

    static defaultProps = {
        labelClass: "col-sm-3 control-label text-left"
    };

    render() {
        const { entity, index, labelClass, onClick } = this.props;

        return (
            <div className={labelClass}>
                <span
                    className="container--action-button"
                    onClick={onClick}>
                    <i className="fa fa-times container--removal-icon"/>{entity ? (' Remove ' + entity + ' ' + index) : ''}
                </span>
            </div>
        )
    }
}
