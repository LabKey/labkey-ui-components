/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { hasAllPermissions, PermissionTypes, SVGIcon, User } from "@glass/base";

// import { SVGIcon } from '../../components/Image/SVGIcon'
import { FieldEditTrigger, FieldEditTriggerProps } from './FieldEditTrigger'

interface Props {
    user: User
    content?: Array<any>
    description?: string
    fieldTriggerProps?: FieldEditTriggerProps
    iconDir?: string
    iconSrc?: string
    iconUrl?: string
    leftColumns?: number
    subTitle?: any
    title: any
}

export class PageDetailHeader extends React.Component<Props, any> {

    static defaultProps = {
        leftColumns: 6
    };

    render() {
        const { children, description, fieldTriggerProps, iconUrl, iconDir, iconSrc, leftColumns, subTitle, title, user } = this.props;

        return (
            <div className="page-header">
                <div className={`col-md-${leftColumns} detail__header--container`}>
                    <div className="detail__header--image-container">
                        {iconUrl ? <img
                                src={iconUrl}
                                className="detail__header-icon"
                            />
                            : <SVGIcon
                                iconDir={iconDir}
                                iconSrc={iconSrc ? iconSrc : ''}
                                className="detail__header-icon"
                            />
                        }
                    </div>
                    <h2 className="no-margin-top detail__header--name">{title}</h2>
                    {subTitle && (
                        <h4 className="test-loc-detail-subtitle">{subTitle}</h4>
                    )}
                    {description && (
                        <span className="detail__header--desc">{description}</span>
                    )}
                    {fieldTriggerProps && (
                        <div className="text__truncate">
                            <FieldEditTrigger {...fieldTriggerProps}
                                canUpdate={hasAllPermissions(user, [PermissionTypes.Update])}
                            />
                        </div>
                    )}
                </div>

                {children && (
                    <div className="pull-right">
                        {children}
                    </div>
                )}

                <div className="clearfix"/>
            </div>
        )
    }
}
