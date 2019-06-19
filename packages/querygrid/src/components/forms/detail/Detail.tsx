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
import * as React from 'react'
import { Panel } from 'react-bootstrap'
import { Map, OrderedMap } from 'immutable'
import { LoadingSpinner, QueryGridModel } from '@glass/base'

import { DefaultRenderer } from "../../../renderers/DefaultRenderer";

const className = 'table table-responsive table-condensed detail-component--table__fixed';

export const _defaultRenderer = (d) => {
    return <DefaultRenderer data={d} />;
};

function processFields(model: QueryGridModel, detailRenderer: Function, titleRenderer: Function): Map<string, DetailField> {
    return model
        .getDisplayColumns()
        .reduce((fields, c) => {
            let fieldKey = c.fieldKey.toLowerCase(),
                renderer;

            if (detailRenderer) {
                renderer = detailRenderer(c);
            }

            if (!renderer) {
                renderer = _defaultRenderer;
            }

            return fields.set(fieldKey, new DetailField({
                fieldKey,
                title: c.caption,
                renderer,
                titleRenderer: titleRenderer ? titleRenderer(c) : <span title={c.fieldKey}>{c.caption}</span>
            }));
        }, OrderedMap<string, DetailField>());
}

interface DetailFieldProps {
    fieldKey: string
    index?: string
    title: string
    renderer: (data: any) => void // React.Element
    titleRenderer: React.ReactNode
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
    queryModel?: QueryGridModel
    detailRenderer?: Function
    titleRenderer?: Function
    asPanel: boolean
}


export class Detail extends React.Component<DetailProps, any> {

    static defaultProps = {
        asPanel: false
    };

    render() {
        const { queryModel, detailRenderer, titleRenderer, asPanel } = this.props;

        if (queryModel && queryModel.isLoaded) {
            const fields = processFields(queryModel, detailRenderer, titleRenderer);
            const target = queryModel.getData();
            let body;

            if (target.size === 0) {
                body = <div>No data available.</div>
            }
            else {
                body = <div>
                    {target.map((row: any, i: number) => {

                        // key safety
                        const newRow = row.reduce((newRow, value, key) => {
                            return newRow.set(key.toLowerCase(), value);
                        }, OrderedMap<string, any>());

                        return (
                            <table className={className} key={i}>
                                <tbody>
                                {fields.map((field: DetailField, key: string) => {
                                    // 'data-caption' tag for test hooks
                                    return (
                                        <tr key={key}>
                                            <td>{field.titleRenderer}</td>
                                            <td data-caption={field.title} data-fieldkey={field.fieldKey}>
                                                {field.renderer(newRow.get(key), row)}
                                            </td>
                                        </tr>
                                    )
                                }).toArray()}
                                </tbody>
                            </table>
                        );
                    })}
                </div>
            }

            return (
                <>
                    {asPanel ?
                        <Panel>
                            <Panel.Heading>Details</Panel.Heading>
                            <Panel.Body>
                                {body}
                            </Panel.Body>
                        </Panel>
                        : body
                    }
                </>
            );
        }

        return <LoadingSpinner/>
    }
}