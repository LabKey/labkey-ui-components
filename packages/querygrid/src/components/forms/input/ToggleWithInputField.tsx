import * as React from 'react';
import { Input } from 'formsy-react-components'
import ReactBootstrapToggle from 'react-bootstrap-toggle'

export interface ToggleWithInputFieldProps {
    active: boolean
    onClick: any
    id: string
    inputFieldName?: string
    on?: string
    off?: string
    style?: any // style for the bootstrap toggle
    containerClassName?: any
}

export class ToggleWithInputField extends React.Component<ToggleWithInputFieldProps, any> {

    static defaultProps = {
        onText: "On",
        offText: "Off"
    };

    render = () => {
        const { active, containerClassName, inputFieldName } = this.props;

        return (
            <span className={containerClassName}>
                {inputFieldName && <Input name={inputFieldName}  type="hidden" value={active}/>}
                <ReactBootstrapToggle {...this.props}/>
            </span>
        );
    }
}