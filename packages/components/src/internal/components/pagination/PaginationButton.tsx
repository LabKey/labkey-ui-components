import React, { PureComponent, ReactNode } from 'react';
import classNames from 'classnames';

import { blurActiveElement } from '../../util/utils';
import { Tip } from '../base/Tip';

interface Props {
    className?: string;
    disabled: boolean;
    iconClass: string;
    onClick: () => void;
    tooltip: string;
}

export class PaginationButton extends PureComponent<Props> {
    onClick = (): void => {
        this.props.onClick();
        blurActiveElement();
    };

    render(): ReactNode {
        const { className, disabled, iconClass, tooltip } = this.props;
        const clsName = classNames(className, 'pagination-button btn btn-default', {
            'disabled-button-with-tooltip': disabled,
        });

        return (
            <Tip caption={tooltip}>
                <button disabled={disabled} className={clsName} onClick={this.onClick} type="button">
                    <i className={`fa ${iconClass}`} />
                </button>
            </Tip>
        );
    }
}
