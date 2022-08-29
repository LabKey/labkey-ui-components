import React, { FC, memo, ReactNode, useMemo } from 'react';
import { List, OrderedMap } from 'immutable';
import { Panel } from 'react-bootstrap';
import { Query } from '@labkey/api';

import { DETAIL_TABLE_CLASSES } from '../constants';

import { decodePart } from '../../../../public/SchemaQuery';

import { QueryColumn } from '../../../../public/QueryColumn';
import { DefaultRenderer } from '../../../renderers/DefaultRenderer';
import { LabelHelpTip } from '../../base/LabelHelpTip';

import {
    resolveDetailEditRenderer,
    resolveDetailRenderer,
    titleRenderer as defaultTitleRenderer,
} from './DetailEditRenderer';

export type Renderer = (data: any, row?: any) => ReactNode;

export interface RenderOptions {
    /** A container filter that will be applied to all query-based inputs in this form */
    containerFilter?: Query.ContainerFilter;
    /** A container path that will be applied to all query-based inputs on this form */
    containerPath?: string;
}

export interface EditRendererOptions extends RenderOptions {
    autoFocus?: boolean;
    hideLabel?: boolean;
    onBlur?: () => void;
    placeholder?: string;
}

export type DetailRenderer = (
    column: QueryColumn,
    options?: RenderOptions,
    fileInputRenderer?: (col: QueryColumn, data: any) => ReactNode,
    onAdditionalFormDataChange?: (name: string, value: any) => any
) => Renderer;

export type TitleRenderer = (column: QueryColumn) => ReactNode;

export const _defaultRenderer = (col: QueryColumn): Renderer => {
    return data => <DefaultRenderer col={col} data={data} />;
};

function processFields(
    queryColumns: List<QueryColumn>,
    detailRenderer?: DetailRenderer,
    titleRenderer?: TitleRenderer,
    options?: RenderOptions,
    fileInputRenderer?: (col: QueryColumn, data: any) => ReactNode,
    onAdditionalFormDataChange?: (name: string, value: any) => any
): OrderedMap<string, DetailField> {
    return queryColumns.reduce((fields, c) => {
        const fieldKey = c.fieldKey.toLowerCase();

        return fields.set(
            fieldKey,
            new DetailField({
                fieldKey,
                title: c.caption,
                renderer:
                    detailRenderer?.(c, options, fileInputRenderer, onAdditionalFormDataChange) ?? _defaultRenderer(c),
                titleRenderer: titleRenderer ? titleRenderer(c) : <span title={c.fieldKey}>{c.caption}</span>,
            })
        );
    }, OrderedMap<string, DetailField>());
}

interface DetailFieldProps {
    fieldKey: string;
    index?: string;
    renderer: Renderer;
    title: string;
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
    detailEditRenderer?: DetailRenderer;
    detailRenderer?: DetailRenderer;
    editingMode?: boolean;
    fieldHelpTexts?: { [key: string]: string };
    fileInputRenderer?: (col: QueryColumn, data: any) => ReactNode;
    onAdditionalFormDataChange?: (name: string, value: any) => any;
    titleRenderer?: TitleRenderer;
}

interface DetailDisplayProps extends DetailDisplaySharedProps {
    data: any;
    displayColumns: List<QueryColumn>;
}

export const DetailDisplay: FC<DetailDisplayProps> = memo(props => {
    const {
        asPanel,
        containerFilter,
        containerPath,
        data,
        displayColumns,
        editingMode,
        fileInputRenderer,
        fieldHelpTexts,
        onAdditionalFormDataChange,
    } = props;

    const detailRenderer = useMemo(() => {
        if (editingMode) {
            return props.detailEditRenderer ?? resolveDetailEditRenderer;
        }
        return props.detailRenderer ?? resolveDetailRenderer;
    }, [props.detailRenderer, props.detailEditRenderer, editingMode]);

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
            { containerFilter, containerPath },
            fileInputRenderer,
            onAdditionalFormDataChange
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
                                        const labelHelp = fieldHelpTexts?.[key];
                                        // 'data-caption' tag for test hooks
                                        return (
                                            <tr key={key}>
                                                <td>
                                                    {field.titleRenderer}
                                                    {labelHelp && (
                                                        <LabelHelpTip title={field.title}>{labelHelp}</LabelHelpTip>
                                                    )}
                                                </td>
                                                <td
                                                    className="text__wrap"
                                                    data-caption={field.title}
                                                    data-fieldkey={field.fieldKey}
                                                >
                                                    {field.renderer(
                                                        newRow.get(decodePart(key)) ?? newRow.get(key),
                                                        row
                                                    )}
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
};

DetailDisplay.displayName = 'DetailDisplay';
