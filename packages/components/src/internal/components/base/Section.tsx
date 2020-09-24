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
import React from 'react';

interface SectionProps {
    caption?: React.ReactNode;
    context?: React.ReactNode;
    panelClassName?: string;
    titleClassName?: string;
    titleContainerClassName?: string;
    title?: string;
    titleSize?: string;
}

export class Section extends React.PureComponent<SectionProps> {
    static defaultProps = {
        titleSize: 'large',
    };

    render() {
        const {
            panelClassName,
            titleClassName,
            titleContainerClassName,
            title,
            titleSize,
            context,
            caption,
            children,
        } = this.props;
        const titleContainerCls = titleContainerClassName || 'section-panel--title-container-' + titleSize;
        return (
            <div className="g-section">
                <div className={`panel panel-default ${panelClassName ? panelClassName : ''}`}>
                    <div className="panel-body">
                        <div className={title ? titleContainerCls : ''}>
                            {title && (
                                <div className={titleClassName || 'section-panel--title-' + titleSize}>{title}</div>
                            )}
                            {context && <div className="pull-right">{context}</div>}
                            {caption && <div className={'section-panel--title-caption-' + titleSize}>{caption}</div>}
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        );
    }
}
