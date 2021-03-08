import React, { CSSProperties, FC, ReactNode } from 'react';
import { Input } from 'formsy-react-components';
import ReactBootstrapToggle from 'react-bootstrap-toggle';

type BootstrapEmphasis = 'danger' | 'default' | 'info' | 'primary' | 'success' | 'warning';

interface ReactBootstrapToggleProps {
    active: boolean;
    handlestyle?: BootstrapEmphasis;
    handleClassName?: string;
    height?: number;
    id?: string;
    off?: ReactNode;
    offstyle?: BootstrapEmphasis;
    offClassName?: string;
    on?: ReactNode;
    onstyle?: BootstrapEmphasis;
    onClassName?: string;
    onClick?: (state: any, node: any, evt: any) => void;
    recalculateOnResize?: boolean;
    size?: 'xs' | 'sm' | 'lg';
    style?: CSSProperties;
    width?: number;
}

interface OwnProps {
    containerClassName?: string;
    inputFieldName?: string;
}

export type ToggleWithInputFieldProps = OwnProps & ReactBootstrapToggleProps;

export const ToggleWithInputField: FC<ToggleWithInputFieldProps> = props => {
    const { containerClassName, inputFieldName, ...toggleProps } = props;

    return (
        <span className={containerClassName}>
            {inputFieldName && <Input name={inputFieldName} type="hidden" value={props.active.toString()} />}
            <ReactBootstrapToggle {...toggleProps} />
        </span>
    );
};
