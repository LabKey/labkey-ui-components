/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, PropsWithChildren, ReactNode } from 'react';

interface SectionProps extends PropsWithChildren {
    caption?: ReactNode;
    context?: ReactNode;
    panelClassName?: string;
    title?: ReactNode;
    titleClassName?: string;
    titleContainerClassName?: string;
    titleSize?: 'large' | 'medium' | 'small';
}

export const Section: FC<SectionProps> = props => {
    const {
        panelClassName,
        titleClassName,
        titleContainerClassName,
        title,
        titleSize = 'large',
        context,
        caption,
        children,
    } = props;
    const showHeader = !!title || !!caption || !!context;

    return (
        <div className="g-section">
            <div className={`panel panel-content ${panelClassName ? panelClassName : ''}`}>
                {showHeader && (
                    <div className={`panel-heading panel-content-flex panel-content-${titleSize}`}>
                        <div className={`panel-content-title-container ${titleContainerClassName ?? ''}`}>
                            {title && titleSize === 'large' && (
                                <h1 className={`panel-content-title-${titleSize} ${titleClassName ?? ''}`}>
                                    {title}
                                </h1>
                            )}
                            {title && titleSize !== 'large' && (
                                <h2 className={`panel-content-title-${titleSize} ${titleClassName ?? ''}`}>
                                    {title}
                                </h2>
                            )}
                            {caption && <div className="panel-content-caption">{caption}</div>}
                        </div>
                        {context && <div className="panel-content-context">{context}</div>}
                    </div>
                )}
                <div className="panel-body">{children}</div>
            </div>
        </div>
    );
};

Section.displayName = 'Section';
