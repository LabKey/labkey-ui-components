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
                            {title && (
                                <div className={`panel-content-title-${titleSize} ${titleClassName ?? ''}`}>
                                    {title}
                                </div>
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
