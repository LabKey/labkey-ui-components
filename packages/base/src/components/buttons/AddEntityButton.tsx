import * as React from 'react';

interface AddEntityButtonProps {
    buttonClass?: string
    containerClass?: string
    entity?: string
    onClick: () => void
}

export class AddEntityButton extends React.Component<AddEntityButtonProps, any> {

    static defaultProps = {
        containerClass: 'form-group'
    };

    render() {
        const { buttonClass, containerClass, entity, onClick } = this.props;

        return (
            <div className={containerClass}>
                <div className={buttonClass}>
                    <span className="container--action-button" onClick={onClick}>
                        <i className="fa fa-plus-circle container--addition-icon"/> Add {entity}
                    </span>
                </div>
            </div>
        )
    }
}