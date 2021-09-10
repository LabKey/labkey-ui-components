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
import React, { FC, PureComponent, ReactNode } from 'react';
import { fromJS, List, Map } from 'immutable';
import { Filter, Utils } from '@labkey/api';

import { resolveErrorMessage, SchemaQuery } from '../../..';

import { DELIMITER, SelectInputOption, SelectInput, SelectInputProps } from './input/SelectInput';
import { resolveDetailFieldValue } from './renderers';
import { initSelect } from './actions';
import { QuerySelectModel } from './model';

function getValue(model: QuerySelectModel, props: QuerySelectOwnProps): any {
    const { rawSelectedValue } = model;

    if (rawSelectedValue !== undefined && !Utils.isString(rawSelectedValue)) {
        if (Array.isArray(rawSelectedValue)) {
            return rawSelectedValue;
        } else if (List.isList(rawSelectedValue)) {
            return rawSelectedValue.toArray();
        } else if (isNaN(rawSelectedValue)) {
            console.warn('QuerySelect: NaN is not a valid value', rawSelectedValue);
            return undefined;
        }
    }

    if (rawSelectedValue === null) {
        return undefined;
    }

    // Issue 37352
    // For reasons not entirely clear we cannot pass in an array of values to QuerySelect when we initialize it
    // while multiple is also set to true. Instead we can only pass in one pre-populated value. We then need to
    // convert that value to an array here, or Formsy will only return a single value if the input is never touched
    // by the user. Converting it to an array right here gets us the best of both worlds: a pre-populated value that
    // is returned as an array when the user hits submit.
    if (
        rawSelectedValue !== undefined &&
        rawSelectedValue !== '' &&
        props.multiple &&
        !Array.isArray(rawSelectedValue)
    ) {
        return [rawSelectedValue];
    }

    return rawSelectedValue;
}

// Issue 33775: Provide a default no-op filter to a React Select to prevent "normal" filtering on the input
// when fetching async query results. They have already been filtered.
const noopFilterOptions = options => options;

const PreviewOption: FC<any> = props => {
    const { model, label, value } = props;
    const { allResults, queryInfo } = model;

    if (queryInfo && allResults.size) {
        const item = allResults.find(result => value === result.getIn([model.valueColumn, 'value']));

        return (
            <>
                {queryInfo.getDisplayColumns(model.schemaQuery.viewName).map((column, i) => {
                    if (item !== undefined) {
                        let text = resolveDetailFieldValue(item.get(column.name));
                        if (!Utils.isString(text)) {
                            text = text ? text.toString() : '';
                        }

                        return (
                            <div key={i} className="text__truncate">
                                <strong>{column.caption}: </strong>
                                <span>{text}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={i} className="text__truncate">
                            <span>{label}</span>
                        </div>
                    );
                })}
            </>
        );
    }

    return null;
};

/**
 * This is a subset of SelectInputProps that are passed through to the SelectInput. Mainly, this set should
 * represent all props of SelectInput that are not overridden by QuerySelect for it's own
 * purposes (e.g. "options" are populated from the QuerySelect's model and thus are not allowed to
 * be specified by the user).
 */
type InheritedSelectInputProps = Omit<
    SelectInputProps,
    | 'allowCreate'
    | 'autoValue'
    | 'cacheOptions'
    | 'defaultOptions' // utilized by QuerySelect to support "preLoad" and "loadOnFocus" behaviors.
    | 'isLoading' // utilized by QuerySelect to support "loadOnFocus" behavior.
    | 'labelKey'
    | 'loadOptions'
    | 'onChange' // overridden by QuerySelect. See onQSChange().
    | 'optionRenderer'
    | 'options'
    | 'valueKey'
>;

export interface QuerySelectOwnProps extends InheritedSelectInputProps {
    componentId: string;
    /** The path to the LK container that the queries should be scoped to. */
    containerPath?: string;
    displayColumn?: string;
    fireQSChangeOnInit?: boolean;
    loadOnFocus?: boolean;
    maxRows?: number;
    onQSChange?: (name: string, value: string | any[], items: any, selectedItems: Map<string, any>) => void;
    onInitValue?: (value: any, selectedValues: List<any>) => void;
    preLoad?: boolean;
    previewOptions?: boolean;
    queryFilters?: List<Filter.IFilter>;
    schemaQuery: SchemaQuery;
    showLoading?: boolean;
    valueColumn?: string;
}

interface State {
    defaultOptions: boolean | SelectInputOption[];
    error: string;
    isLoading: boolean;
    loadOnFocusLock: boolean;
    model: QuerySelectModel;
}

export class QuerySelect extends PureComponent<QuerySelectOwnProps, State> {
    static defaultProps = {
        delimiter: DELIMITER,
        filterOption: noopFilterOptions,
        fireQSChangeOnInit: false,
        loadOnFocus: false,
        preLoad: true,
        previewOptions: false,
        showLoading: true,
    };

    private _mounted: boolean;
    private querySelectTimer: number;

    constructor(props: QuerySelectOwnProps) {
        super(props);
        this.state = this.getInitialState(props);
    }

    componentDidMount(): void {
        this._mounted = true;
        this.initModel();
    }

    componentDidUpdate(prevProps: QuerySelectOwnProps): void {
        if (prevProps.componentId !== this.props.componentId) {
            this.initModel();
        }
    }

    /**
     * This is an override of setState() as defined on React.Component. With the extensive use
     * of QuerySelect throughout our applications the calling of setState() after the component has been
     * unmounted is a rather frequent occurrence.
     * NK: This is not an ideal solution as unmounted async calls to setState() are considered an
     * anti-pattern in React. That said, this works for the time being to alleviate intermittent
     * test failures resulting from erroneous handling in Jest. If a better solution comes along please use it.
     */
    override setState = (state: any, callback?: () => void): void => {
        if (this._mounted) {
            super.setState(state, callback);
        }
    };

    initModel = async (): Promise<void> => {
        this.setState(this.getInitialState(this.props));

        try {
            const model = await initSelect(this.props);
            this.setState({ model });
        } catch (error) {
            this.setState({ error: resolveErrorMessage(error) ?? 'Failed to initialize.' });
        }
    };

    getInitialState = (props: QuerySelectOwnProps): State => {
        return {
            // See note in onFocus() regarding support for "loadOnFocus"
            defaultOptions: props.preLoad !== false ? true : props.loadOnFocus ? [] : true,
            error: undefined,
            isLoading: undefined,
            loadOnFocusLock: false,
            model: undefined,
        };
    };

    componentWillUnmount(): void {
        this._mounted = false;
        clearTimeout(this.querySelectTimer);
    }

    shouldLoadOnFocus = (): boolean => {
        return this.props.loadOnFocus && !this.state.loadOnFocusLock;
    };

    loadOptions = (input: string): Promise<SelectInputOption[]> => {
        clearTimeout(this.querySelectTimer);

        // If loadOptions occurs prior to call to "onFocus" then there is no need to "loadOnFocus".
        if (this.shouldLoadOnFocus()) {
            this.setState({ loadOnFocusLock: true });
        }

        return new Promise((resolve, reject): void => {
            this.querySelectTimer = window.setTimeout(async () => {
                this.querySelectTimer = undefined;

                try {
                    const { model } = this.state;

                    const data = await model.search(input);

                    // prevent stale state updates of ReactSelect
                    if (!this._mounted) return;

                    const models = fromJS(data.models[data.key]);

                    resolve(model.formatSavedResults(models, input));

                    this.setState(() => ({
                        model: model.saveSearchResults(models),
                    }));
                } catch (error) {
                    const errorMsg = resolveErrorMessage(error) ?? 'Failed to retrieve search results.';
                    console.error(errorMsg, error);
                    reject(errorMsg);
                    this.setState({ error: errorMsg });
                }
            }, 250);
        });
    };

    onChange = (name: string, value: any, selectedOptions): void => {
        this.setState(
            state => ({ model: state.model.setSelection(value) }),
            () => {
                this.props.onQSChange?.(name, value, selectedOptions, this.state.model.selectedItems);
            }
        );
    };

    optionRenderer = (props): ReactNode => {
        return <PreviewOption label={props.label} model={this.state.model} value={props.value} />;
    };

    onFocus = async (): Promise<void> => {
        // NK: To support loading the select upon focus (a.k.a. "loadOnFocus") we have to explicitly utilize
        // the "defaultOptions" and "isLoading" properties of ReactSelect. These properties, in tandem with
        // "loadOptions", allow for an asynchronous ReactSelect to defer requesting the initial options until
        // desired. This follows the pattern outlined here:
        // https://github.com/JedWatson/react-select/issues/1525#issuecomment-744157380
        if (this.shouldLoadOnFocus()) {
            // Set and forget "loadOnFocusLock" state so "loadOnFocus" only occurs on the initial focus.
            this.setState({ loadOnFocusLock: true, isLoading: true });

            const defaultOptions = await this.loadOptions('');

            // ReactSelect respects "isLoading" with a value of {undefined} differently from a value of {false}.
            this.setState({ defaultOptions, isLoading: undefined });
        }
    };

    render() {
        const {
            allowDisable,
            containerClass,
            description,
            filterOption,
            formsy,
            initiallyDisabled,
            inputClass,
            label,
            labelClass,
            multiple,
            onToggleDisable,
            previewOptions,
            required,
            showLoading,
        } = this.props;
        const { defaultOptions, error, isLoading, model } = this.state;

        if (error) {
            const inputProps = {
                allowDisable,
                onToggleDisable,
                description,
                initiallyDisabled,
                formsy,
                containerClass,
                inputClass,
                disabled: true,
                labelClass,
                isLoading: false,
                label,
                multiple,
                name: this.props.name || this.props.componentId + '-error',
                placeholder: `Error: ${error}`,
                required,
                type: 'text',
            };

            return <SelectInput {...inputProps} />;
        } else if (model?.isInit) {
            const inputProps = Object.assign(
                {
                    id: model.id,
                    label: label !== undefined ? label : model.queryInfo.title,
                },
                this.props,
                {
                    allowCreate: false,
                    autoValue: false, // QuerySelect directly controls value of ReactSelect via selectedOptions
                    cacheOptions: true,
                    defaultOptions,
                    filterOption,
                    isLoading,
                    loadOptions: this.loadOptions,
                    onChange: this.onChange,
                    onFocus: this.onFocus,
                    options: undefined, // prevent override
                    optionRenderer: previewOptions ? this.optionRenderer : undefined,
                    selectedOptions: model.getSelectedOptions(),
                    value: getValue(model, this.props), // needed to initialize the Formsy "value" properly
                }
            );

            return <SelectInput {...inputProps} />;
        } else if (showLoading) {
            const inputProps = {
                allowDisable,
                containerClass,
                inputClass,
                labelClass,
                description,
                initiallyDisabled,
                disabled: true,
                onToggleDisable,
                formsy,
                label,
                multiple,
                name: this.props.name || this.props.componentId + '-loader',
                placeholder: 'Loading...',
                required,
                type: 'text',
                value: undefined,
            };

            return <SelectInput {...inputProps} />;
        }

        return null;
    }
}
