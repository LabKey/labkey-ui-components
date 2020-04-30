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
    title?: string;
}

// FIXME: remove all of these inline styles, make actual CSS classes.
// FIXME: stop using React.SFC as it is deprecated (likely just convert to a PureComponent for now)
export const Section: React.SFC<SectionProps> = props => (
    <>
        <div className="g-section">
            <div className={`panel panel-default ${props.panelClassName ? props.panelClassName : ''}`}>
                <div className="panel-body">
                    <div style={props.title ? { borderBottom: '2px solid #cccccc', marginBottom: '30px' } : {}}>
                        {props.title && (
                            <div style={{ display: 'inline-block', fontSize: '200%', marginBottom: '8px' }}>
                                {props.title}
                            </div>
                        )}
                        {props.context && <div className="pull-right">{props.context}</div>}
                        {props.caption && <div style={{ fontWeight: 300, marginBottom: '8px' }}>{props.caption}</div>}
                    </div>
                    {props.children}
                </div>
            </div>
        </div>
    </>
);
