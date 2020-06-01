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
import { List } from 'immutable';

import { ValueDescriptor } from '../models';

const DETAIL_ALIAS_WORD_LENGTH = 5,
    GRID_ALIAS_WORD_LENGTH = 3;

interface AliasRendererProps {
    data: List<any>;
    view?: string;
}

interface AliasRendererState {
    showMore?: boolean;
}

export class AliasRenderer extends React.Component<AliasRendererProps, AliasRendererState> {
    constructor(props?: AliasRendererProps) {
        super(props);

        this.state = {
            showMore: false,
        };
    }

    static getEditableRawValue = (values: List<ValueDescriptor>): string[] => {
        return values.reduce((arr, vd) => {
            if (vd.display !== undefined && vd.display !== null) {
                arr.push(vd.display);
            }
            return arr;
        }, []);
    };

    static getEditableValue = (values: List<ValueDescriptor>): string => {
        return values.reduce((str, v) => {
            if (v.display) {
                if (str) {
                    return str + ', ' + v.display;
                }
                return v.display;
            }
            else return str;
        }, '');
    };

    handleClick = (): void => {
        const { showMore } = this.state;

        this.setState({
            showMore: !showMore,
        });
    };

    render() {
        const { data, view } = this.props;
        const { showMore } = this.state;

        if (data && data.size > 0) {
            const truncationLength = view === 'detail' ? DETAIL_ALIAS_WORD_LENGTH : GRID_ALIAS_WORD_LENGTH;
            const extraCount = data.size - truncationLength;

            const aliases = data.map(alias => alias.get('displayValue'));

            const aliasDisplay = aliases
                .filter((alias, i) => {
                    return i < truncationLength || showMore;
                })
                .join(', ');

            let trailingLink;
            if (extraCount > 0) {
                trailingLink = (
                    <span>
                        {!showMore ? `... and ${extraCount} more ` : ' '}
                        <span className="alias-renderer--more-link" onClick={this.handleClick}>
                            {!showMore ? '(see all)' : '(see less)'}
                        </span>
                    </span>
                );
            }
            return (
                <div className="alias-renderer" title={aliases.join(', ')}>
                    {aliasDisplay}
                    {trailingLink}
                </div>
            );
        }

        return null;
    }
}
