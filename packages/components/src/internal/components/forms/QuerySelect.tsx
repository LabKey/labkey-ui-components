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
import React, { FC, ReactNode } from 'react';
import { fromJS, List, Map } from 'immutable';
import { Filter, Utils } from '@labkey/api';

import { QueryColumn, SchemaQuery } from '../../..';

import { DELIMITER, FilterOption, SelectInputOption, SelectInput } from './input/SelectInput';
import { resolveDetailFieldValue } from './renderers';
import { initSelect } from './actions';
import { FOCUS_FLAG } from './constants';
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

// 33775: Provide a default no-op filter to a React Select to prevent "normal" filtering on the input when fetching
// async query results. They have already been filtered.
function noopFilterOptions(options: SelectInputOption[]): SelectInputOption[] {
    return options;
}

const PreviewOption: FC<any> = props => {
    const { model, ...optionProps } = props;
    const { allResults, queryInfo } = model;
    const {
        className,
        cx,
        getStyles,
        innerProps,
        innerRef,
        isDisabled,
        isFocused,
        isSelected,
        label,
        value,
    } = optionProps;

    if (queryInfo && allResults.size) {
        const item = allResults.find(result => value === result.getIn([model.valueColumn, 'value']));

        return (
            <div
                className={cx(
                    {
                        option: true,
                        'option--is-disabled': isDisabled,
                        'option--is-focused': isFocused,
                        'option--is-selected': isSelected,
                    },
                    className
                )}
                ref={innerRef}
                style={getStyles('option', props)}
                {...innerProps}
            >
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
            </div>
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
interface InheritedSelectInputProps {
    allowCreate?: boolean;
    allowDisable?: boolean;
    onToggleDisable?: (disabled: boolean) => void;
    backspaceRemoves?: boolean;
    clearCacheOnChange?: boolean;
    clearable?: boolean;
    delimiter?: string;
    description?: string;
    disabled?: boolean;
    filterOptions?: FilterOption;
    formsy?: boolean;
    initiallyDisabled?: boolean;
    inputClass?: string;
    joinValues?: boolean;
    label?: React.ReactNode;
    labelClass?: string;
    multiple?: boolean;
    name?: string;
    noResultsText?: string;
    placeholder?: string;
    required?: boolean;
    saveOnBlur?: boolean;
    showLabel?: boolean;
    addLabelAsterisk?: boolean;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    validations?: any;
    value?: any;
}

export interface QuerySelectOwnProps extends InheritedSelectInputProps {
    // required
    componentId: string;
    schemaQuery: SchemaQuery;

    // optional
    containerClass?: string; // The css class used by SelectInput, has nothing to do with LK containers.
    containerPath?: string; // The path to the LK container that the queries should be scoped to.
    displayColumn?: string;
    fireQSChangeOnInit?: boolean;
    loadOnChange?: boolean; // TODO: Hook "loadOnChange" to "clearCacheOnChange". May/may not fully overlap.
    loadOnFocus?: boolean;
    maxRows?: number;
    onQSChange?: (name: string, value: string | any[], items: any, selectedItems: Map<string, any>) => void;
    onInitValue?: (value: any, selectedValues: List<any>) => void;
    preLoad?: boolean;
    previewOptions?: boolean;
    queryFilters?: List<Filter.IFilter>;
    showLoading?: boolean;
    valueColumn?: string;
}

interface State {
    error: any;
    focused: boolean;
    model: QuerySelectModel;
}

const INITIAL_STATE: State = { error: undefined, focused: false, model: undefined };

export class QuerySelect extends React.Component<QuerySelectOwnProps, State> {
    static defaultProps = {
        delimiter: DELIMITER,
        filterOptions: noopFilterOptions,
        fireQSChangeOnInit: false,
        loadOnChange: false,
        loadOnFocus: false,
        preLoad: false,
        previewOptions: false,
        showLoading: true,
    };

    private _deferredLoad: () => void;
    private readonly _loadOnFocusEnabled = false;
    private _mounted: boolean;
    private querySelectTimer: number;

    state: Readonly<State> = INITIAL_STATE;

    componentDidMount(): void {
        this._mounted = true;
        this.initModel();
    }

    componentDidUpdate(prevProps: QuerySelectOwnProps): void {
        if (prevProps.componentId !== this.props.componentId) {
            this.initModel();
        }
    }

    initModel = async (): Promise<void> => {
        this.setState(INITIAL_STATE);

        try {
            const model = await initSelect(this.props);
            this.setState({ model });
        } catch (error) {
            this.setState({ error });
        }
    };

    componentWillUnmount(): void {
        this._mounted = false;
        clearTimeout(this.querySelectTimer);
    }

    loadOnFocus = (): boolean => {
        // TODO: Works relatively well, however, the loading "..." still appears on the select until it is focused.
        // Determine if there is a way to prevent it from displaying that symbol (passing "isLoading: false" does not work).
        return this._loadOnFocusEnabled && !this.state.focused && (this.props.loadOnFocus || this.state.model.preLoad);
    };

    loadOptions = (input: string): Promise<any> => {
        if (this.loadOnFocus()) {
            return new Promise((resolve): void => {
                this._deferredLoad = async (): Promise<void> => {
                    resolve(await this._loadOptions(input));
                };
            });
        }

        return this._loadOptions(input);
    };

    _loadOptions = (input: string): Promise<any> => {
        clearTimeout(this.querySelectTimer);

        return new Promise((resolve): void => {
            const { model } = this.state;

            const token = model.parseSearch(input);

            if (token !== false) {
                this.querySelectTimer = window.setTimeout(() => {
                    this.querySelectTimer = undefined;
                    const v = token === true ? input : token;
                    model.search(v).then(data => {
                        const { model } = this.state;

                        // prevent stale state updates of ReactSelect
                        // -- yes, a cancelable promise would work as well
                        if (this._mounted !== true) {
                            return;
                        }

                        const key = data.key,
                            models = fromJS(data.models[key]);

                        resolve(model.formatSavedResults(models, v));

                        this.setState(() => ({
                            model: model.saveSearchResults(models),
                        }));
                    });
                }, 250);
            } else {
                resolve(model.formatSavedResults());
            }
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
        return <PreviewOption {...props} model={this.state.model} />;
    };

    onFocus = (): void => {
        if (this.loadOnFocus()) {
            this.setState(
                () => ({ focused: true }),
                () => {
                    this._deferredLoad?.();
                    this._deferredLoad = undefined;
                }
            );
        }
    };

    render() {
        const {
            allowDisable,
            onToggleDisable,
            description,
            filterOptions,
            formsy,
            initiallyDisabled,
            label,
            loadOnChange,
            previewOptions,
            required,
            showLoading,
        } = this.props;
        const { error, model } = this.state;

        if (error) {
            const inputProps = {
                allowDisable,
                onToggleDisable,
                description,
                initiallyDisabled,
                formsy,
                containerClass: this.props.containerClass,
                inputClass: this.props.inputClass,
                disabled: true,
                labelClass: this.props.labelClass,
                isLoading: false,
                label,
                name: this.props.name || this.props.componentId + '-error',
                placeholder: 'Error: ' + error.message,
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
                    autoValue: false, // QuerySelect will directly control value of ReactSelect via selectedOptions
                    cacheOptions: true,
                    clearCacheOnChange: loadOnChange,
                    description,
                    filterOptions,
                    // ignoreCase: false,
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
            // This <Input/> is used as a placeholder for fields while the model
            // is initialized. The intent is to allow normal required validation to work
            // even while QuerySelects are being initialized
            const inputProps = {
                allowDisable,
                containerClass: this.props.containerClass,
                inputClass: this.props.inputClass,
                labelClass: this.props.labelClass,
                description,
                initiallyDisabled,
                disabled: true,
                onToggleDisable,
                formsy,
                label,
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
