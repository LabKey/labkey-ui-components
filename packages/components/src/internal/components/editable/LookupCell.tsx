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
import React, { FocusEvent, ReactNode } from 'react';
import ReactN from 'reactn';
import { List, Map } from 'immutable';

import { initLookup, modifyCell, searchLookup } from '../../actions';
import { LookupStore, ValueDescriptor } from '../../models';
import { LOOKUP_DEFAULT_SIZE, MODIFICATION_TYPES, SELECTION_TYPES } from '../../constants';
import { QueryColumn, QuerySelect, SchemaQuery, SelectInput, SelectInputOption } from '../../..';
import { GlobalAppState } from '../../global';

const emptyList = List<ValueDescriptor>();

const customStyles = {
    control: (provided, state) => ({
        ...provided,
        minHeight: 24,
        borderRadius: 0,
    }),
    valueContainer: (provided, state) => ({
        ...provided,
        minHeight: 24,
        padding: '0 4px',
    }),
    input: (provided, state) => ({
        ...provided,
        margin: '0px',
    }),
    indicatorsContainer: (provided, state) => ({
        ...provided,
        minHeight: 24,
    }),
};

const customTheme = theme => ({
    ...theme,
    colors: {
        ...theme.colors,
        danger: '#D9534F',
        primary: '#2980B9',
        primary75: '#009BF9',
        primary50: '#F2F9FC',
        primary25: 'rgba(41, 128, 185, 0.1)',
    },
    spacing: {
        ...theme.spacing,
        baseUnit: 2,
    },
});

export interface LookupCellProps {
    col: QueryColumn;
    colIdx: number;
    disabled?: boolean;
    modelId: string;
    rowIdx: number;
    select: (modelId: string, colIdx: number, rowIdx: number, selection?: SELECTION_TYPES, resetValue?: boolean) => any;
    values: List<ValueDescriptor>;
    onCellModify?: () => any;
    filteredLookupValues?: List<string>;
    filteredLookupKeys?: List<any>;
}

interface LookupCellState {
    token?: string;
}

export class LookupCellWithQuerySelect extends ReactN.Component<LookupCellProps, undefined, GlobalAppState> {
    private blurTO: number;


    isMultiValue = (): boolean => {
        return this.props.col.isJunctionLookup();
    };

    onInputBlur = (event: FocusEvent<HTMLElement>): void => {
        console.log("onInputBlur");
        // TODO this is not always called.  Is it needed?
        this.blurTO = window.setTimeout(() => {
            const { colIdx, modelId, rowIdx } = this.props;
            this.props.select(modelId, colIdx, rowIdx);
        }, 200);
    };

    onInputChange = (fieldName: string, formValue: string | any[], items: any, selectedItems: Map<string, any>): void => {

        const { col, colIdx, modelId, rowIdx, onCellModify } = this.props;
        const vd = {
            raw: Array.isArray(items) ? items[items.length-1].value : items?.value,
            display: Array.isArray(items) ? items[items.length-1].label : items?.label
        }
        modifyCell(
            modelId,
            colIdx,
            rowIdx,
            vd,
            col.isJunctionLookup() ? MODIFICATION_TYPES.ADD : MODIFICATION_TYPES.REPLACE
        );
        if (onCellModify) onCellModify();

        if (!this.isMultiValue()) {
            this.props.select(modelId, colIdx, rowIdx);
            return;
        }
    };


    render(): ReactNode {
        const { col, values } = this.props;

        const lookup = col.lookup;
        const isMultiple = this.isMultiValue();
        lookup.keyColumn
        const rawValues = values.filter(vd => vd.raw !== undefined).map(vd => (
            vd.raw
        )).toArray()

        return (
            <QuerySelect
                autoFocus
                disabled={this.props.disabled}
                multiple={isMultiple}
                schemaQuery={SchemaQuery.create(lookup.schemaName, lookup.queryName)}
                componentId={LookupStore.key(col)}
                maxRows={LOOKUP_DEFAULT_SIZE}
                containerPath={lookup.containerPath}
                containerClass="select-input-cell-container"
                customTheme={customTheme}
                customStyles={customStyles}
                inputClass="select-input-cell"
                placeholder=""
                onBlur={this.onInputBlur}
                onQSChange={this.onInputChange}
                label={null}
                preLoad={true}
                value={isMultiple ? rawValues : rawValues[0]}
            />
        );
    }
}

export class LookupCellWithSelectInput extends ReactN.Component<LookupCellProps, LookupCellState, GlobalAppState> {
    private blurTO: number;

    constructor(props: LookupCellProps) {
        // @ts-ignore // see https://github.com/CharlesStover/reactn/issues/126
        super(props);


        this.state = {
            token: undefined,
        };
    }

    componentDidMount(): void {
        const { col, filteredLookupValues, filteredLookupKeys } = this.props;
        initLookup(col, LOOKUP_DEFAULT_SIZE, filteredLookupValues, filteredLookupKeys);
    }

    isMultiValue = (): boolean => {
        return this.props.col.isJunctionLookup();
    };

    onInputBlur = (event: FocusEvent<HTMLElement>): void => {
        this.blurTO = window.setTimeout(() => {
            const { colIdx, modelId, rowIdx } = this.props;
            this.props.select(modelId, colIdx, rowIdx);
            this.resetLookup();
        }, 200);
    };

    onInputChange = (fieldName: string, formValue, selectedOptions): void => {

        const { col, colIdx, modelId, rowIdx, onCellModify } = this.props;
        const vd = {
            raw: formValue,
            display: selectedOptions?.label
        }
        modifyCell(
            modelId,
            colIdx,
            rowIdx,
            vd,
            col.isJunctionLookup() ? MODIFICATION_TYPES.ADD : MODIFICATION_TYPES.REPLACE
        );
        if (onCellModify) onCellModify();

        if (!this.isMultiValue()) {
            this.props.select(modelId, colIdx, rowIdx);
            return;
        }
    };

    resetLookup = (): void => {
        this.searchLookup(undefined);
    };

    searchLookup = (token: string): void => {
        searchLookup(
            this.props.col,
            LOOKUP_DEFAULT_SIZE,
            token,
            this.props.filteredLookupValues,
            this.props.filteredLookupKeys
        );
    };

    getStore(): LookupStore {
        const { col } = this.props;

        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid_lookups.get(LookupStore.key(col));
    }

    getOptions(props: LookupCellProps): List<ValueDescriptor> {
        const { values } = props;
        const store = this.getStore();

        if (store) {
            return store.descriptors
                .filter(vd => {
                    return !(values && values.some(v => v.raw === vd.raw && vd.display === vd.display));
                })
                .toList();
        }

        return emptyList;
    }

    loadOptions = (input: string): Promise<SelectInputOption[]> => {
        this.searchLookup(input);

        return new Promise((resolve) => {
            const { values } = this.props;
            const store = this.getStore();
            if (store) {
                resolve(store.descriptors
                    .filter(vd => {
                        return !(values && values.some(v => v.raw === vd.raw && vd.display === vd.display));
                    })
                    .map(vd => (
                        {
                            label: vd.display,
                            value: vd.raw
                        }
                    )).toArray());
            } else {
                resolve([]);
            }
        })

    }

    render(): ReactNode {
        const { col, values } = this.props;

        const isMultiple = this.isMultiValue();
        const rawValues = values.filter(vd => vd.raw !== undefined).map(vd => ({
            label: vd.display,
            value: vd.raw
        })).toArray();

        return (
            <SelectInput
                autoFocus
                disabled={this.props.disabled}
                multiple={isMultiple}
                containerClass="select-input-cell-container"
                inputClass="select-input-cell"
                placeholder=""
                id={LookupStore.key(col)}
                loadOptions={this.loadOptions}
                onBlur={this.onInputBlur}
                onChange={this.onInputChange}
                valueKey={"value"}
                labelKey={"label"}
                value={isMultiple ? rawValues : rawValues[0]}
            />
        );
    }
}
