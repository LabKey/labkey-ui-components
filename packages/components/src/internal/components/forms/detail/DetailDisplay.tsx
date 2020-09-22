import React, { PureComponent, ReactNode } from 'react';
import { List, Map, OrderedMap } from 'immutable';
import { Panel } from 'react-bootstrap';

import { DefaultRenderer, QueryColumn } from '../../../../index';

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
    titleRenderer: ReactNode;
}

// TODO: export this class and make users import the set of fields or indexes
class DetailField {
    fieldKey: string;
    index?: string;
    title: string;
    renderer: Function;
    titleRenderer: ReactNode;

    constructor(config: DetailFieldProps) {
        this.fieldKey = config.fieldKey;
        this.index = config.index;
        this.title = config.title;
        this.renderer = config.renderer;
        this.titleRenderer = config.titleRenderer;
    }
}

export interface DetailDisplaySharedProps {
    asPanel?: boolean;
    detailRenderer?: Function;
    editingMode?: boolean;
    titleRenderer?: Function;
    useDatePicker?: boolean;
}

interface DetailDisplayProps extends DetailDisplaySharedProps {
    data: any;
    displayColumns: List<QueryColumn>;
}

export class DetailDisplay extends PureComponent<DetailDisplayProps> {
    static defaultProps = {
        asPanel: false,
        editingMode: false,
        useDatePicker: true,
    };

    render() {
        const { asPanel, data, detailRenderer, displayColumns, useDatePicker, titleRenderer } = this.props;

        let body;

        if (data.size === 0) {
            body = <div>No data available.</div>;
        } else {
            const fields = processFields(displayColumns, detailRenderer, titleRenderer, useDatePicker);

            body = (
                <div>
                    {data.map((row: any, i: number) => {
                        // key safety
                        const newRow = row.reduce((newRow, value, key) => {
                            return newRow.set(key.toLowerCase(), value);
                        }, OrderedMap<string, any>());

                        return (
                            <table className={DETAIL_TABLE_CLASSES} key={i}>
                                <tbody>
                                    {fields
                                        .map((field, key) => {
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
}
