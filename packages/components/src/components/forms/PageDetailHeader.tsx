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
import React, { PureComponent, ReactNode } from 'react';
import { PermissionTypes } from '@labkey/api';

import { hasAllPermissions } from '../../util/utils';
import { User } from '../base/models/model';
import { SVGIcon } from '../base/SVGIcon';

import { FieldEditorOverlay, FieldEditorOverlayProps } from './FieldEditorOverlay';

interface Props {
    description?: ReactNode;
    fieldTriggerProps?: FieldEditorOverlayProps;
    iconAltText?: string;
    iconDir?: string;
    iconSrc?: string;
    iconUrl?: string;
    leftColumns?: number;
    subTitle?: ReactNode;
    title: ReactNode;
    user?: User;
}

export class PageDetailHeader extends PureComponent<Props> {
    static defaultProps = {
        leftColumns: 6,
    };

    render(): ReactNode {
        const {
            children,
            description,
            fieldTriggerProps,
            iconAltText,
            iconUrl,
            iconDir,
            iconSrc,
            leftColumns,
            subTitle,
            title,
            user,
        } = this.props;

        if (fieldTriggerProps && !user) {
            throw Error('PageDetailHeader: If supplying "fieldTriggerProps", then "user" prop must be specified.');
        }

        return (
            <div className="page-header">
                <div className={`col-md-${leftColumns} detail__header--container`}>
                    {(iconUrl || iconSrc) && (
                        <div className="detail__header--image-container">
                            {iconUrl ? (
                                <img src={iconUrl} className="detail__header-icon" />
                            ) : (
                                <SVGIcon
                                    iconDir={iconDir}
                                    iconSrc={iconSrc ? iconSrc : ''}
                                    className="detail__header-icon"
                                    alt={iconAltText ? iconAltText : ''}
                                />
                            )}
                        </div>
                    )}
                    <h2 className="no-margin-top detail__header--name">{title}</h2>
                    {subTitle && <h4 className="test-loc-detail-subtitle">{subTitle}</h4>}
                    {description && <span className="detail__header--desc">{description}</span>}
                    {fieldTriggerProps && (
                        <div className="text__truncate">
                            <FieldEditorOverlay
                                {...fieldTriggerProps}
                                canUpdate={hasAllPermissions(user, [PermissionTypes.Update])}
                            />
                        </div>
                    )}
                </div>
                {children && <div className="pull-right">{children}</div>}
                <div className="clearfix" />
            </div>
        );
    }
}
