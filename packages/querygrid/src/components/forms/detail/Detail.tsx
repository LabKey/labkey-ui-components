/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
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
}


export class Detail extends React.Component<DetailProps, any> {

    render() {
        const { queryModel, detailRenderer, titleRenderer } = this.props;

        if (queryModel && queryModel.isLoaded) {
            const fields = processFields(queryModel, detailRenderer, titleRenderer);
            const target = queryModel.getData();

            return (
                <div>
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
            );
        }

        return <LoadingSpinner/>
    }
}