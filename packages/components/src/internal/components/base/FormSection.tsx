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
import React, { FC, PropsWithChildren, ReactNode } from 'react';
import classNames from 'classnames';
import { Utils } from '@labkey/api';

interface Props extends PropsWithChildren {
    addContent?: ReactNode;
    iconSpacer?: boolean;
    label?: ReactNode;
    onAddClick?: () => void;
    showLabel?: boolean;
}

export const FormSection: FC<Props> = ({
    addContent,
    children,
    iconSpacer = true,
    label,
    onAddClick,
    showLabel = true,
}) => (
    <>
        {showLabel && label !== undefined && (
            <div className="row">
                <div className="col-sm-12">
                    {Utils.isString(label) ? (
                        <label className="control-label text-left">
                            <strong>{label}</strong>
                        </label>
                    ) : (
                        label
                    )}
                </div>
            </div>
        )}
        <div className="row">
            <div className="col-sm-12">
                <div
                    className={classNames('wizard-row--container', {
                        'wizard-row--spacer': iconSpacer,
                    })}
                >
                    {children}
                    {addContent && (
                        <div className="add-row--container" onClick={onAddClick}>
                            {addContent}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </>
);
