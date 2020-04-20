import React from 'react';
import { Button } from 'react-bootstrap';

interface Props {
    first: string;
    second: string;
    active?: string;
    onClick: (selected: string) => void;
}

export class ToggleButtons extends React.Component<Props, any> {
    render() {
        const { first, second, onClick, active } = this.props;

        return (
            <div className="btn-group">
                <Button active={active === first} bsSize="small" onClick={() => onClick(first)}>
                    {first}
                </Button>
                <Button active={active === second} bsSize="small" onClick={() => onClick(second)}>
                    {second}
                </Button>
            </div>
        );
    }
}
