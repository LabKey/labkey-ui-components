import * as React from 'react';
import { DropdownButton } from "react-bootstrap";

interface Props {
    id: string
    pullRight: boolean
    collapsed: boolean
}

export class ManageDropdownButton extends React.Component<Props, any> {

    static defaultProps = {
        pullRight: false,
        collapsed: false
    };

    render() {
        const { id, pullRight, collapsed } = this.props;
        const btnId = id + '-managebtn';

        if (collapsed) {
            return (
                <DropdownButton
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