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
import React, { Component, PropsWithChildren, ReactNode } from 'react';
import classNames from 'classnames';
import { Utils } from '@labkey/api';

interface Props extends PropsWithChildren {
    addContent?: ReactNode;
    iconSpacer?: boolean;
    label?: ReactNode;
    onAddClick?: () => any;
    showLabel?: boolean;
}

export class FormSection extends Component<Props, any> {
    static defaultProps = {
        iconSpacer: true,
        showLabel: true,
    };

    showLabel(): boolean {
        return this.props.showLabel && this.props.label !== undefined;
    }

    render() {
        const { label } = this.props;

        return (
            <>
                {this.showLabel() && (
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
                                'wizard-row--spacer': this.props.iconSpacer,
                            })}
                        >
                            {this.props.children}
                            {this.props.addContent && (
                                <div className="add-row--container" onClick={this.props.onAddClick}>
                                    {this.props.addContent}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }
}
