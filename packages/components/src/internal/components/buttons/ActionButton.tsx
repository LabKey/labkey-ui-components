/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PropsWithChildren, ReactNode } from 'react';
import classNames from 'classnames';

import { LabelHelpTip } from '../base/LabelHelpTip';

export interface ActionButtonProps extends PropsWithChildren {
    buttonClass?: string;
    containerClass?: string;
    disabled?: boolean;
    helperBody?: ReactNode;
    helperTitle?: string;
    onClick: () => void;
    title?: string;
}

export class ActionButton extends React.PureComponent<ActionButtonProps> {
    static defaultProps = {
        containerClass: 'form-group',
        helperTitle: 'More Info',
    };

    render() {
        const { buttonClass, containerClass, disabled, onClick, title, helperBody, helperTitle, children } = this.props;

        const buttonClasses = classNames('container--action-button btn btn-default', { disabled });

        return (
            <div className={containerClass} title={title}>
                <div className={buttonClass}>
                    <button className={buttonClasses} onClick={disabled ? undefined : onClick} type="button">
                        {children}
                    </button>
                    {helperBody && <LabelHelpTip title={helperTitle}>{helperBody}</LabelHelpTip>}
                </div>
            </div>
        );
    }
}
