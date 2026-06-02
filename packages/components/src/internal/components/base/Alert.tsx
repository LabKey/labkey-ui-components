/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, HTMLProps, PropsWithChildren, ReactNode } from 'react';
import classNames from 'classnames';

export interface AlertProps extends HTMLProps<HTMLDivElement>, PropsWithChildren {
    bsStyle?: string;
    closeLabel?: ReactNode;
    onDismiss?: () => void;
}

/**
 * An Alert that will only display if children are available. Defaults to bsStyle "danger".
 */
export const Alert: FC<AlertProps> = props => {
    const { bsStyle = 'danger', children, className, closeLabel, onDismiss, ...divProps } = props;
    if (!children) return null;

    const dismissible = !!onDismiss;
    return (
        <div
            {...divProps}
            className={classNames(className, `alert alert-${bsStyle}`, { 'alert-dismissable': dismissible })}
            role="alert"
        >
            {dismissible && (
                <button className="close" onClick={onDismiss} type="button">
                    <span aria-hidden="true">&times;</span>
                    <span className="sr-only">{closeLabel}</span>
                </button>
            )}
            {children}
        </div>
    );
};

Alert.displayName = 'Alert';
