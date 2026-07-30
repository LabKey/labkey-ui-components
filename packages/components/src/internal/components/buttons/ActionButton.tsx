/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PropsWithChildren, ReactNode } from 'react';
import classNames from 'classnames';

import { LabelHelpTip } from '../base/LabelHelpTip';

export interface ActionButtonProps {
    buttonClass?: string;
    containerClass?: string;
    disabled?: boolean;
    helperBody?: ReactNode;
    helperTitle?: string;
    onClick: () => void;
    title?: string;
}

export const ActionButton: FC<ActionButtonProps & PropsWithChildren> = memo(props => {
    const {
        buttonClass,
        children,
        containerClass = 'form-group',
        disabled,
        helperBody,
        helperTitle = 'More Info',
        onClick,
        title,
    } = props;
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
});
ActionButton.displayName = 'ActionButton';
