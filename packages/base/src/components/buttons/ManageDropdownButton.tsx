import * as React from 'react';
import { DropdownButton } from "react-bootstrap";

interface Props {
    disabled: boolean
    id: string
    pullRight: boolean
    collapsed: boolean
}

export class ManageDropdownButton extends React.Component<Props, any> {

    static defaultProps = {
        disabled: false,
        pullRight: false,
        collapsed: false
    };

    render() {
        const { id, pullRight, collapsed, disabled } = this.props;
        const btnId = id + '-managebtn';

        if (collapsed) {
            return (
                <DropdownButton
                    disabled={disabled}
                    id={btnId}
                    title={<span><i className="fa fa-bars"/></span>}
                    noCaret={true}
                    pullRight={pullRight}
                >
                    {this.props.children}
                </DropdownButton>
            )
        }

        return (
            <DropdownButton
                disabled={disabled}
                id={btnId}
                bsStyle={'primary'}
                title={'Manage'}
                pullRight={pullRight}
            >
                {this.props.children}
            </DropdownButton>
        );
    }
}