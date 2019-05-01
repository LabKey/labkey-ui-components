/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { Map, OrderedMap } from 'immutable'
import { Input } from 'formsy-react-components'
import { Utils } from '@labkey/api'
import { caseInsensitive, insertColumnFilter, QueryColumn, QueryInfo, SchemaQuery } from '@glass/base'

import { resolveRenderer } from './renderers'
import { QuerySelect } from './QuerySelect'
import { TextInput } from './TextInput'
import { DateInput } from './DateInput'
import { CheckboxInput } from './CheckboxInput'
import { TextAreaInput } from './TextAreaInput'
import { FileInput } from './FileInput'
import { initLookup } from "../../actions";

const LABEL_FIELD_SUFFIX = '::label';

export function getLabelFieldName(name: string): string {
    return name + LABEL_FIELD_SUFFIX;
}

interface QueryFormInputsProps {
    columnFilter?: (col?: QueryColumn) => boolean
    componentKey?: string // unique key to add to QuerySelect to avoid duplication w/ transpose
    destroyOnDismount?: boolean
    fieldValues?: any
    fireQSChangeOnInit?: boolean
    includeLabelField?: boolean
    onQSChange?: (name: string, value: string | Array<any>, items: any) => any
    queryColumns?: OrderedMap<string, QueryColumn>
    queryInfo?: QueryInfo
    lookups?: Map<string, number>
    onChange?: Function
    renderFileInputs?: boolean
}

interface State {
    labels: any
}

export class QueryFormInputs extends React.Component<QueryFormInputsProps, State> {

    static defaultProps = {
        includeLabelField: false,
        renderFileInputs: false,
    };

    constructor(props: QueryFormInputsProps) {
        super(props);

        const { queryInfo, queryColumns } = this.props;

        if (!queryInfo && !queryColumns) {
            throw new Error('QueryFormInputs: If queryInfo is not provided, queryColumns is required.');
        }

        this.onQSChange = this.onQSChange.bind(this);

        this.state = {
            labels: {}
        };
    }

    static cleanValues(fieldValues: any, customValues?: any): any {
        const cleanValues = {...fieldValues, ...customValues};

        return Object.keys(cleanValues)
            .filter(fieldKey => !fieldKey.endsWith(LABEL_FIELD_SUFFIX))
            .reduce((newFieldValues, fieldKey) => {
                newFieldValues[fieldKey] = cleanValues[fieldKey];
                return newFieldValues;
            }, {});
    }

    onQSChange(name: string, value: string | Array<any>, items: any) {
        const { includeLabelField, onQSChange } = this.props;

        if (includeLabelField) {
            let allItems: Array<any> = items;
            if (!Utils.isArray(allItems)) {
                allItems = [allItems];
            }

            this.setState({
                labels: {
                    ...this.state.labels, ...{
                        [getLabelFieldName(name)]: allItems.map(item => item ? item.label : '(label not found)').join(', ')
                    }
                }
            });
        }

        if (onQSChange) {
            onQSChange(name, value, items);
        }
    }

    renderLabelField(col: QueryColumn) {
        const { includeLabelField } = this.props;

        if (includeLabelField) {
            const fieldName = getLabelFieldName(col.name);
            return <Input name={fieldName} type="hidden" value={this.state.labels[fieldName]}/>
        }

        return null;
    }

    render() {
        const {
            columnFilter,
            componentKey,
            destroyOnDismount,
            fieldValues,
            fireQSChangeOnInit,
            lookups,
            queryColumns,
            queryInfo,
            onChange,
            renderFileInputs,
        } = this.props;
        const filter = columnFilter ? columnFilter : insertColumnFilter;

        const columns = queryInfo ? queryInfo.columns : queryColumns;

        // CONSIDER: separately establishing the set of columns and allow
        // QueryFormInputs to be a rendering factory for the columns that are in the set.
        if (columns) {
            return columns
                .filter(filter)
                .valueSeq()
                .map((col: QueryColumn, i: number) => {
                    let value = caseInsensitive(fieldValues, col.name);

                    if (!value && lookups) {
                        value = lookups.get(col.name) || lookups.get((col.name).toLowerCase());
                    }

                    if (!value && col.jsonType === 'string') {
                        value = '';
                    }

                    if (col.inputRenderer) {
                        const renderer = resolveRenderer(col);
                        if (renderer) {
                            return renderer(col, i, value);
                        }

                        throw new Error(`"${col.inputRenderer}" is not a valid inputRenderer.`);
                    }

                    if (col.isLookup()) {
                        initLookup(col, undefined);
                        // undefined 'displayAsLookup' just respects the lookup.
                        // Must be explicitly false to prevent drop-down.
                        if (col.displayAsLookup !== false) {
                            const multiple = col.isJunctionLookup();
                            const joinValues = multiple && !col.isExpInput();
                            let id = col.fieldKey + i + (componentKey ? componentKey : '');

                            return (
                                <React.Fragment key={i}>
                                    {this.renderLabelField(col)}
                                    <QuerySelect
                                        componentId={id}
                                        destroyOnDismount={destroyOnDismount}
                                        fireQSChangeOnInit={fireQSChangeOnInit}
                                        joinValues={joinValues}
                                        label={col.caption}
                                        loadOnChange
                                        loadOnFocus
                                        maxRows={10}
                                        multiple={multiple}
                                        name={col.name}
                                        onQSChange={this.onQSChange}
                                        placeholder="Select or type to search..."
                                        preLoad
                                        previewOptions={true}
                                        required={col.required}
                                        schemaQuery={SchemaQuery.create(col.lookup.schemaName, col.lookup.queryName)}
                                        valueColumn={col.lookup.keyColumn}
                                        value={value}/>
                                </React.Fragment>
                            )
                        }
                    }

                    if (col.inputType === 'textarea') {
                        return <TextAreaInput key={i} queryColumn={col} value={value} />;
                    } else if (col.inputType === 'file' && renderFileInputs) {
                        return <FileInput key={i} queryColumn={col} value={value} onChange={onChange} />;
                    }

                    switch (col.jsonType) {
                        case 'date':
                            return <DateInput key={i} queryColumn={col} value={value}/>;
                        case 'boolean':
                            return <CheckboxInput key={i} queryColumn={col} value={value}/>;
                        default:
                            return <TextInput key={i} queryColumn={col} value={value}/>;
                    }
                })
                .toArray();
        }
    }
}