/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { List, Map } from 'immutable'
import { Input, Checkbox, Textarea } from 'formsy-react-components'
import { QueryColumn, getUnFormattedNumber } from '@glass/base'

import { LabelOverlay } from "../LabelOverlay";
import { DateInput } from "../input/DateInput";
import { _defaultRenderer } from "./Detail";
import { resolveRenderer } from "../renderers";
import { MultiValueRenderer } from "../../../renderers/MultiValueRenderer";
import { AliasRenderer } from "../../../renderers/AliasRenderer";
import { AppendUnits } from "../../../renderers/AppendUnits";
import { SelectRowsSelect } from "../input/SelectRowsSelect";

function findValue(data: Map<string, any>, lookup?: boolean) {
    return data.has('displayValue') && lookup !== true ? data.get('displayValue') : data.get('value')
}

function resolveDetailFieldValue(data: any, lookup?: boolean): string | Array<string> {
    let value;

    if (data) {
        if (List.isList(data) && data.size) {
            value = data.map(d => {
                if (d.has('formattedValue')) {
                    return d.get('formattedValue');
                }

                let o = findValue(d, lookup);
                return o !== null && o !== undefined ? o : undefined;
            }).toArray();
        }
        else if (data.has('formattedValue')) {
            value = data.get('formattedValue');
        }
        else {
            let o = findValue(data, lookup);
            value = o !== null && o !== undefined ? o : undefined;
        }
    }

    // avoid setting value to 'null' use 'undefined' instead
    return value === null ? undefined : value;
}

export function titleRenderer(col: QueryColumn): React.ReactNode {
    //If the column cannot be edited, return the label as is
    if (!col.isEditable()) {
        return (
            <span className='field__un-editable'>{col.caption}</span>
        );
    }

    return <LabelOverlay column={col} />;
}

export function resolveDetailEditRenderer(col: QueryColumn): React.ReactNode {

    return (data) => {
        const editable = col.isEditable();

        // If the column cannot be edited, return as soon as possible
        // Render the value with the defaultRenderer and a class that grays it out
        if (!editable) {
            return (
                <div className="field__un-editable">{_defaultRenderer(data)}</div>
            );
        }

        let value = resolveDetailFieldValue(data, false);

        if (col.inputRenderer) {
            const renderer = resolveRenderer(col);

            if (renderer) {
                return renderer(col, col.name, value, true);
            }

            throw new Error(`"${col.inputRenderer}" is not a valid inputRenderer.`);
        }

        if (col.isLookup()) {
            // undefined 'displayAsLookup' just respects the lookup.
            // Must be explicitly false to prevent drop-down.
            if (col.displayAsLookup !== false) {
                // 29232: When displaying a lookup, always use the value
                const multiple = col.isJunctionLookup(),
                    joinValues = multiple && !col.isDataInput();
                return (
                    <SelectRowsSelect
                        containerClass="form-group row"
                        inputClass="col-sm-12"
                        joinValues={joinValues}
                        key={col.name}
                        multiple={multiple}
                        queryColumn={col}
                        value={resolveDetailFieldValue(data, true)}
                        required={col.required}/>
                );
            }
        }

        if (col.inputType == 'textarea') {
            return (
                <Textarea
                    changeDebounceInterval={0}
                    cols={4}
                    elementWrapperClassName={[{"col-sm-9": false}, "col-sm-12"]}
                    name={col.name}
                    required={col.required}
                    rows={4}
                    validatePristine={true}
                    value={value}/>
            );
        }

        switch (col.jsonType) {
            case 'boolean':
                return (
                    <Checkbox
                        name={col.name}
                        required={col.required}
                        validatePristine={true}
                        value={value && value.toString().toLowerCase() === 'true'}/>
                );
            case 'date':
                if (typeof value === 'string') {
                    return (
                        <DateInput
                            elementWrapperClassName={[{"col-sm-9": false}, "col-sm-12"]}
                            name={col.name}
                            queryColumn={col}
                            validatePristine={true}
                            value={value}/>
                    );
                 }
            default:
                let validations,
                    validationError;

                if (col.jsonType === 'int' || col.jsonType === 'float') {
                    let unformat = getUnFormattedNumber(value);
                    if (unformat !== undefined && unformat !== null) {
                        value = unformat.toString();
                    }
                    validations = col.jsonType === 'int' ? 'isInt' : 'isFloat';
                    validationError = 'Expected type: ' + col.jsonType;
                }

                return (
                    <Input
                        changeDebounceInterval={0}
                        type="text"
                        name={col.name}
                        validatePristine={true}
                        validations={validations}
                        validationError={validationError}
                        value={value}
                        required={col.required}
                        elementWrapperClassName={[{"col-sm-9": false}, "col-sm-12"]}/>
                );
        }
    };
}

export function resolveDetailRenderer(column: QueryColumn) {

    let renderer; // defaults to undefined -- leave it up to the details

    if (column && column.detailRenderer) {
        switch (column.detailRenderer.toLowerCase()) {
            // TODO add a mechanism for the application to register detail renderers (similar to column renderers, see getQueryColumnRenderers() in querygrid/src/global.ts)
            // case 'nucleotidesequencedetail':
            //     renderer = (d) => <NucleotideSequenceDetail data={d}/>;
            //     break;
            // case 'sequencejunctiondetail':
            //     renderer = (d, r) => <SequenceJunctionDetail data={d} row={r}/>;
            //     break;
            // case 'sequenceloadrenderer':
            //     renderer = (d) => <SequenceLoader data={d}/>;
            //     break;
            case 'multivaluedetailrenderer':
                renderer = (d) => <MultiValueRenderer data={d}/>;
                break;
            case 'aliasrenderer':
                renderer = (d) => <AliasRenderer data={d} view="detail"/>;
                break;
            case 'appendunits':
                renderer = (d) => <AppendUnits data={d} col={column}/>;
                break;
            default:
                break;
        }
    }

    return renderer;
}