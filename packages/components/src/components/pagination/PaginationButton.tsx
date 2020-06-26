import React, { PureComponent, ReactNode } from 'react';
import { Button } from 'react-bootstrap';

import { blurActiveElement } from '../../util/utils';
import { Tip } from '../..';

interface Props {
    disabled: boolean;
    iconClass: string;
    tooltip: string;
    onClick: () => void;
}

export class PaginationButton extends PureComponent<Props> {
    onClick = (): void => {
        this.props.onClick();
        blurActiveElement();
    };

    render(): ReactNode {
        const { disabled, iconClass, tooltip } = this.props;
        const className = disabled ? 'disabled-button-with-tooltip' : '';

        return (
            <Tip caption={tooltip}>
                <Button onClick={this.onClick} disabled={disabled} className={className}>
                    <i className={`fa ${iconClass}`} />
                </Button>
            </Tip>
        );
    }
}
