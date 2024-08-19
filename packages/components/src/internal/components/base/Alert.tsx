/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { FC, HTMLProps, ReactNode } from 'react';
import classNames from 'classnames';

export interface AlertProps extends HTMLProps<HTMLDivElement> {
    bsStyle?: string;
    closeLabel?: ReactNode;
    onDismiss?: () => void;
}

/**
 * An Alert that will only display if children are available. Defaults to bsStyle "danger".
 */
export const Alert: FC<AlertProps> = props => {
    const { bsStyle, children, className, closeLabel, onDismiss, ...divProps } = props;
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

Alert.defaultProps = {
    bsStyle: 'danger',
};

Alert.displayName = 'Alert';
