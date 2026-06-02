/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PropsWithChildren, PureComponent, ReactNode } from 'react';

import { SVGIcon } from '../base/SVGIcon';

interface PageDetailHeaderProps extends PropsWithChildren {
    description?: ReactNode;
    iconAltText?: string;
    iconDir?: string;
    iconSrc?: string;
    iconUrl?: string;
    leftColumns?: number;
    subTitle?: ReactNode;
    title: ReactNode;
}

/**
 * @deprecated use AppPageHeader in ui-premium instead
 */
export class PageDetailHeader extends PureComponent<PageDetailHeaderProps> {
    static defaultProps = {
        leftColumns: 6,
    };

    render(): ReactNode {
        const { children, description, iconAltText, iconUrl, iconDir, iconSrc, leftColumns, subTitle, title } =
            this.props;
        const hasIcon = iconUrl || iconSrc;

        return (
            <div className="page-header">
                <div className={`col-xs-12 col-md-${leftColumns} detail__header--container`}>
                    {hasIcon && (
                        <div className="detail__header--image-container">
                            {iconUrl ? (
                                <img
                                    alt={iconAltText ? iconAltText : ''}
                                    className="detail__header-icon"
                                    src={iconUrl}
                                />
                            ) : (
                                <SVGIcon
                                    alt={iconAltText ? iconAltText : ''}
                                    className="detail__header-icon"
                                    iconDir={iconDir}
                                    iconSrc={iconSrc ? iconSrc : ''}
                                />
                            )}
                        </div>
                    )}
                    <div className={hasIcon ? 'detail__header-icon--body-container' : ''}>
                        <h1 className="no-margin-top detail__header--name">{title}</h1>
                        {subTitle && <div className="detail-subtitle">{subTitle}</div>}
                        {description && <span className="detail__header--desc">{description}</span>}
                    </div>
                </div>
                {children && <div className="pull-right">{children}</div>}
                <div className="clearfix" />
            </div>
        );
    }
}
