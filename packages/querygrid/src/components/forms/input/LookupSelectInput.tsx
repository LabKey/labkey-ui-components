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
import {Map, fromJS} from 'immutable'
import { QueryColumn, QueryLookup, naturalSort, generateId, LoadingSpinner, resolveKey } from '@glass/base'

import { SelectInput, SelectInputProps } from "./SelectInput";
import { selectRows } from "../../../query/api";
import { LabelOverlay } from "../LabelOverlay";

interface SelectOption {
    label: string
    value: any
}

function formatOptions(lookup: QueryLookup, models: Map<string, any>): Array<SelectOption> {
    if (!models) {
        return [];
    }

    return models.map(model => {
        let fieldKey = lookup.displayColumn;

        if (fieldKey.indexOf('/') > -1) {
            fieldKey = fieldKey.substr(fieldKey.indexOf('/') + 1);
        }

        return {
            label: model.getIn([fieldKey, 'formattedValue']) ||
                   model.getIn([fieldKey, 'displayValue']) ||
                   model.getIn([fieldKey, 'value']),
            value: model.getIn([lookup.keyColumn, 'value'])
        };
    }).sortBy(model => model.label, naturalSort).toArray();
}

interface StateProps {
    options: Array<SelectOption>
}

interface OwnProps extends SelectInputProps {
    queryColumn: QueryColumn
}

export class LookupSelectInput extends React.Component<OwnProps, StateProps> {

    _id: string;

    constructor(props: OwnProps) {
        super(props);

        // require our own id here so the <LabelOverlay> can be associated correctly
        this._id = generateId('select-');

        this.state = {
            options: undefined
        }
    }

    componentWillMount() {
        const { queryColumn } = this.props;
        const { options } = this.state;

        if (!queryColumn || !queryColumn.isLookup()) {
            throw 'querygrid forms/input/<LookupSelectInput> only works with lookup columns.';
        }
        else if (queryColumn.displayAsLookup === false) {
            console.warn('querygrid forms/input/<LookupSelectInput> received lookup column that is explicitly set displayAsLookup = false');
        }

        const { schemaName, queryName } = queryColumn.lookup;

        if (!options) {
            selectRows({schemaName, queryName})
                .then(response => {
                    const models = Map<string, any>(fromJS(response.models));
                    const options = formatOptions(queryColumn.lookup, models.get(resolveKey(schemaName, queryName)));
                    this.setState(() => ({options}));
                }
            );
        }
    }

    // TODO is this still needed, if so need to update after move to querygrid
    // shouldComponentUpdate(nextProps: OwnProps) {
    //     return nextProps.options.length !== this.props.options.length ||
    //             nextProps.value !== this.props.value ||
    //             nextProps.disabled !== this.props.disabled;
    // }

    render() {
        const { queryColumn, value } = this.props;
        const { options } = this.state;

        if (!options) {
            return <LoadingSpinner/>;
        }

        // if multiValued = 'junction', the select should support MultiSelect and the value should be joined as an array of strings
        // !Except for the faked up parent column (DataInputs/<DataClassName> in Insert.tsx) where a comma separated string is required
        const multiple = queryColumn.isJunctionLookup(),
            joinValues = multiple && !queryColumn.isDataInput(),
            id = this._id;

        const inputProps = Object.assign({
            // properties that can be overridden
            id,
            label: <LabelOverlay column={queryColumn} inputId={id} isFormsy={false}/>,
            multiple,
            name: queryColumn.name,
            required: queryColumn.required
        }, this.props, {
            // properties that cannot be changed
            joinValues,
            options,
            queryColumn: undefined,
            // If joinValues is true, and a value is present ensure value is passed in as an Array<string>
            value: (joinValues && value && !Array.isArray(value)) ? [value] : value
        });

        return <SelectInput {...inputProps} options={options}/>;
    }
}
