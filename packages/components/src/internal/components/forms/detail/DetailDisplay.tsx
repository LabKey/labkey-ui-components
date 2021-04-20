import React, { FC, memo, ReactNode, useMemo } from 'react';
import { List, Map, OrderedMap } from 'immutable';
import { Panel } from 'react-bootstrap';

import { DefaultRenderer, QueryColumn } from '../../../..';

import { DETAIL_TABLE_CLASSES } from '../constants';

import {
    resolveDetailEditRenderer,
    resolveDetailRenderer,
    titleRenderer as defaultTitleRenderer,
} from './DetailEditRenderer';
import { decodePart } from '../../../../public/SchemaQuery';

export type Renderer = (data: any, row?: any) => ReactNode;

export interface RenderOptions {
    useDatePicker?: boolean;
}

export type DetailRenderer = (
    column: QueryColumn,
    options?: RenderOptions,
    fileInputRenderer?: (col: QueryColumn, data: any) => ReactNode
) => Renderer;

export type TitleRenderer = (column: QueryColumn) => ReactNode;

export const _defaultRenderer: Renderer = d => <DefaultRenderer data={d} />;

function processFields(
    queryColumns: List<QueryColumn>,
    detailRenderer: DetailRenderer,
    titleRenderer: TitleRenderer,
    options?: RenderOptions,
    fileInputRenderer?: (col: QueryColumn, data: any) => ReactNode
): Map<string, DetailField> {
    return queryColumns.reduce((fields, c) => {
        const fieldKey = c.fieldKey.toLowerCase();
        let renderer;

        if (detailRenderer) {
            renderer = detailRenderer(c, options, fileInputRenderer);
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
    renderer: Renderer;
    titleRenderer: ReactNode;
}

// TODO: export this class and make users import the set of fields or indexes
class DetailField {
    fieldKey: string;
    index?: string;
    title: string;
    renderer: Renderer;
    titleRenderer: ReactNode;

    constructor(config: DetailFieldProps) {
        this.fieldKey = config.fieldKey;
        this.index = config.index;
        this.title = config.title;
        this.renderer = config.renderer;
        this.titleRenderer = config.titleRenderer;
    }
}

export interface DetailDisplaySharedProps extends RenderOptions {
    asPanel?: boolean;
    detailRenderer?: DetailRenderer;
    editingMode?: boolean;
    titleRenderer?: TitleRenderer;
    fileInputRenderer?: (col: QueryColumn, data: any) => ReactNode;
}

interface DetailDisplayProps extends DetailDisplaySharedProps {
    data: any;
    displayColumns: List<QueryColumn>;
}

export const DetailDisplay: FC<DetailDisplayProps> = memo(props => {
    const { asPanel, data, displayColumns, editingMode, useDatePicker, fileInputRenderer } = props;

    const detailRenderer = useMemo(() => {
        return props.detailRenderer ?? (editingMode ? resolveDetailEditRenderer : resolveDetailRenderer);
    }, [props.detailRenderer, editingMode]);

    const titleRenderer = useMemo(() => {
        return props.titleRenderer ?? (editingMode ? defaultTitleRenderer : undefined);
    }, [props.titleRenderer, editingMode]);

    let body;

    if (data.size === 0) {
        body = <div>No data available.</div>;
    } else {
        const fields = processFields(
            displayColumns,
            detailRenderer,
            titleRenderer,
            { useDatePicker },
            fileInputRenderer
        );

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
                                                    {field.renderer(newRow.get(decodePart(key)), row)}
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

    if (asPanel) {
        return (
            <Panel>
                <Panel.Heading>Details</Panel.Heading>
                <Panel.Body>{body}</Panel.Body>
            </Panel>
        );
    }

    return body;
});

DetailDisplay.defaultProps = {
    asPanel: false,
    editingMode: false,
    useDatePicker: true,
};

DetailDisplay.displayName = 'DetailDisplay';
