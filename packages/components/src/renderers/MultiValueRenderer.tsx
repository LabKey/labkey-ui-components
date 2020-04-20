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
import { Map } from 'immutable';

interface MultiValueRendererProps {
    data: Map<any, any>;
}

export class MultiValueRenderer extends React.Component<MultiValueRendererProps, any> {
    render() {
        const { data } = this.props;

        if (data && data.size > 0) {
            const len = data.size;
            return (
                <div>
                    {data.map((item, i) => {
                        let text;
                        if (item.has('formattedValue')) {
                            text = item.get('formattedValue');
                        } else {
                            const o = item.has('displayValue') ? item.get('displayValue') : item.get('value');
                            text = o !== null && o !== undefined ? o.toString() : null;
                        }

                        return (
                            <span key={i}>
                                {item.get('url') ? <a href={item.get('url')}>{text}</a> : text}
                                {i + 1 < len ? ', ' : ''}
                            </span>
                        );
                    })}
                </div>
            );
        }

        return null;
    }
}
