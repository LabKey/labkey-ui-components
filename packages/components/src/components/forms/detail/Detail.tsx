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
import { Panel } from 'react-bootstrap';
import { List, Map, OrderedMap } from 'immutable';

import { DefaultRenderer } from '../../../renderers/DefaultRenderer';
import { LoadingSpinner } from '../../base/LoadingSpinner';
import { QueryColumn, QueryGridModel } from '../../base/models/model';
import { DETAIL_TABLE_CLASSES } from '../constants';

export const _defaultRenderer = d => {
    return <DefaultRenderer data={d} />;
};

function processFields(
    queryColumns: List<QueryColumn>,
    detailRenderer: Function,
    titleRenderer: Function,
    useDatePicker: boolean
): Map<string, DetailField> {
    return queryColumns.reduce((fields, c) => {
        let fieldKey = c.fieldKey.toLowerCase(),
            renderer;

        if (detailRenderer) {
            renderer = detailRenderer(c, useDatePicker);
        }

        if (!renderer) {
            renderer = _defaultRenderer;
        }

        return fields.set(
            fieldKey,
            new DetailField({
                fieldKey,
                title: c.caption,
                renderer,
                titleRenderer: titleRenderer ? titleRenderer(c) : <span title={c.fieldKey}>{c.caption}</span>,
            })
        );
    }, OrderedMap<string, DetailField>());
}

interface DetailFieldProps {
    fieldKey: string;
    index?: string;
    title: string;
    renderer: (data: any) => void; // React.Element
    titleRenderer: React.ReactNode;
}

// TODO: export this class and make users import the set of fields or indexes
class DetailField {
    fieldKey: string;
    index?: string;
    title: string;
    renderer: Function;
    titleRenderer: React.ReactNode;

    constructor(config: DetailFieldProps) {
        this.fieldKey = config.fieldKey;
        this.index = config.index;
        this.title = config.title;
        this.renderer = config.renderer;
        this.titleRenderer = config.titleRenderer;
    }
}

interface DetailProps {
    queryModel?: QueryGridModel;
    queryColumns?: List<QueryColumn>;
    detailRenderer?: Function;
    titleRenderer?: Function;
    asPanel: boolean;
    editingMode?: boolean;
    useDatePicker?: boolean;
}

export class Detail extends React.Component<DetailProps, any> {
    static defaultProps = {
        asPanel: false,
        editingMode: false,
        useDatePicker: true,
    };

    render() {
        const { queryModel, detailRenderer, editingMode, titleRenderer, asPanel, useDatePicker } = this.props;

        if (queryModel && queryModel.isLoaded) {
            const displayCols = editingMode
                ? queryModel.getUpdateDisplayColumns()
                : queryModel.getDetailsDisplayColumns();
            const fields = processFields(
                this.props.queryColumns || displayCols,
                detailRenderer,
                titleRenderer,
                useDatePicker
            );
            const target = queryModel.getData();
            let body;

            if (target.size === 0) {
                body = <div>No data available.</div>;
            } else {
                body = (
                    <div>
                        {target.map((row: any, i: number) => {
                            // key safety
                            const newRow = row.reduce((newRow, value, key) => {
                                return newRow.set(key.toLowerCase(), value);
                            }, OrderedMap<string, any>());

                            return (
                                <table className={DETAIL_TABLE_CLASSES} key={i}>
                                    <tbody>
                                        {fields
                                            .map((field: DetailField, key: string) => {
                                                // 'data-caption' tag for test hooks
                                                return (
                                                    <tr key={key}>
                                                        <td>{field.titleRenderer}</td>
                                                        <td data-caption={field.title} data-fieldkey={field.fieldKey}>
                                                            {field.renderer(newRow.get(key), row)}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                            .toArray()}
                                    </tbody>
                                </table>
                            );
                        })}
                    </div>
                );
            }

            return (
                <>
                    {asPanel ? (
                        <Panel>
                            <Panel.Heading>Details</Panel.Heading>
                            <Panel.Body>{body}</Panel.Body>
                        </Panel>
                    ) : (
                        body
                    )}
                </>
            );
        }

        return <LoadingSpinner />;
    }
}
