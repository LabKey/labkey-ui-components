import React, { PureComponent, ReactNode } from 'react';
import { Button } from 'react-bootstrap';
import classNames from 'classnames';

import { blurActiveElement } from '../../../util/utils';
import { Tip } from '../../../index';

interface Props {
    disabled: boolean;
    iconClass: string;
    tooltip: string;
    onClick: () => void;
    className?: string;
}

export class PaginationButton extends PureComponent<Props> {
    onClick = (): void => {
        this.props.onClick();
        blurActiveElement();
    };

    render(): ReactNode {
        const { className, disabled, iconClass, tooltip } = this.props;
        const clsName = classNames(className, 'pagination-button', { 'disabled-button-with-tooltip': disabled });

        return (
            <Tip caption={tooltip}>
                <Button onClick={this.onClick} disabled={disabled} className={clsName}>
                    <i className={`fa ${iconClass}`} />
                </Button>
            </Tip>
        );
    }
}
