import React, { PureComponent, ReactNode } from 'react';
import { Button } from 'react-bootstrap';

interface Props {
    first: string;
    second: string;
    active?: string;
    onClick: (selected: string) => void;
    className?: string;
}

export class ToggleButtons extends PureComponent<Props> {
    render(): ReactNode {
        const { first, second, onClick, active, className } = this.props;
        const firstActive = active === first;
        const secondActive = active === second;

        return (
            <div className={'btn-group' + (className ? ' ' + className : '')}>
                <Button bsStyle={firstActive ? 'primary' : 'default'} bsSize="small" onClick={() => onClick(first)}>
                    {first}
                </Button>
                <Button bsStyle={secondActive ? 'primary' : 'default'} bsSize="small" onClick={() => onClick(second)}>
                    {second}
                </Button>
            </div>
        );
    }
}
