/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ComponentType, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { List, Map } from 'immutable';
import { Filter, Query, Utils } from '@labkey/api';

import { SchemaQuery } from '../../../public/SchemaQuery';

import { lookupValidationErrorMessage, resolveErrorMessage } from '../../util/messaging';

import { Row } from '../../query/selectRows';

import { QueryInfo } from '../../../public/QueryInfo';

import { isTestEnv } from '../../util/utils';

import { useTimeout } from '../../hooks';

import { SelectInput, SelectInputChange, SelectInputOption, SelectInputProps } from './input/SelectInput';
import { resolveDetailFieldLabel } from './utils';
import {
    fetchSearchResults,
    formatResults,
    formatSavedResults,
    initSelect,
    parseSelectedQuery,
    QuerySelectModel,
    saveSearchResults,
    setSelection,
} from './model';
import { DELIMITER } from './constants';

function getValue(model: QuerySelectModel, multiple: boolean): any {
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
    // while multiple is also set to true. Instead, we can only pass in one pre-populated value. We then need to
    // convert that value to an array here, or Formsy will only return a single value if the input is never touched
    // by the user. Converting it to an array right here gets us the best of both worlds: a pre-populated value that
    // is returned as an array when the user hits submit.
    if (rawSelectedValue !== undefined && rawSelectedValue !== '' && multiple && !Array.isArray(rawSelectedValue)) {
        return [rawSelectedValue];
    }

    return rawSelectedValue;
}

// Issue 33775: Provide a default no-op filter to a React Select to prevent "normal" filtering on the input
// when fetching async query results. They have already been filtered.
const noopFilterOptions = options => options;

export interface QuerySelectOptionProps extends Pick<SelectInputOption, 'label' | 'value'> {
    queryInfo: QueryInfo;
    row: Row;
}

type QuerySelectOptionComponent = ComponentType<QuerySelectOptionProps>;

interface OptionRendererProps extends Pick<SelectInputOption, 'label' | 'value'> {
    model: QuerySelectModel;
    OptionComponent?: QuerySelectOptionComponent;
}

const OptionRenderer: FC<OptionRendererProps> = props => {
    const { OptionComponent, label, model, value } = props;
    const { allResults, queryInfo } = model;

    if (queryInfo && allResults.size) {
        const columns = queryInfo.getLookupViewColumns(model.displayColumn);
        const item = allResults.find(result => value === result.getIn([model.valueColumn, 'value']));

        if (OptionComponent) {
            return <OptionComponent label={label} queryInfo={queryInfo} row={item?.toJS() as Row} value={value} />;
        }

        return (
            <>
                {columns.map((column, i) => {
                    if (item !== undefined) {
                        let text = resolveDetailFieldLabel(item.get(column.name));
                        if (!Utils.isString(text)) {
                            if (text == null)
                                text = '';
                            else if (Array.isArray(text))
                                text = text.join(', ');
                        }

                        return (
                            <div key={i}>
                                {columns.length > 1 && (
                                    <span className="identifying_field_label">{column.caption ?? column.name}: </span>
                                )}
                                <span>{text}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={i}>
                            <span>{label}</span>
                        </div>
                    );
                })}
            </>
        );
    }

    return null;
};
OptionRenderer.displayName = 'OptionRenderer';

// This "extends" the SelectInputChange type by adding additional parameters. This should always extend the
// signature of SelectInputChange so onChange event handling can be coalesced.
export type QuerySelectChange = (
    name: string,
    value: any,
    selectedOptions: SelectInputOption | SelectInputOption[],
    props: Partial<SelectInputProps>,
    selectedItems: Map<string, any>
) => void;

/**
 * This is a subset of SelectInputProps that are passed through to the SelectInput. Mainly, this set should
 * represent all props of SelectInput that are not overridden by QuerySelect for its own
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
    | 'optionRenderer' // overridden by QuerySelect. Use "OptionComponent" instead.
    | 'options'
    | 'selectedOptions'
    | 'valueKey'
>;

export interface QuerySelectOwnProps extends InheritedSelectInputProps {
    autoInit?: boolean;
    containerFilter?: Query.ContainerFilter;
    /** The path to the LK container that the queries should be scoped to. */
    containerPath?: string;
    delimiter?: string;
    displayColumn?: string;
    displaySelectedOptions?: boolean;
    fireQSChangeOnInit?: boolean;
    groupByColumn?: string;
    loadOnFocus?: boolean;
    maxRows?: number;
    /** When enabled "not found" (i.e. unresolved) values will be processed as selectable items. */
    notFoundValuesEnabled?: boolean;
    onInitValue?: (value: any, selectedValues: List<any>) => void;
    onQSChange?: QuerySelectChange;
    OptionComponent?: QuerySelectOptionComponent;
    preLoad?: boolean;
    queryFilters?: List<Filter.IFilter>;
    queryParams?: Record<string, any>;
    requiredColumns?: string[];
    schemaQuery: SchemaQuery;
    showLoading?: boolean;
    valueColumn?: string;
}

type DefaultOptions = boolean | SelectInputOption[];

type Search = {
    input: string;
    reject: (reason?: any) => any;
    resolve: (value: PromiseLike<SelectInputOption[]> | SelectInputOption[]) => void;
};

export const QuerySelect: FC<QuerySelectOwnProps> = memo(props => {
    const {
        OptionComponent,
        // Prevent initialization in test environments in lieu of mocking APIWrapper in all test locations
        autoInit = !isTestEnv(),
        containerFilter,
        containerPath,
        delimiter = DELIMITER,
        displayColumn,
        displaySelectedOptions = true,
        fireQSChangeOnInit = false,
        groupByColumn,
        loadOnFocus = false,
        maxRows,
        notFoundValuesEnabled = true,
        onInitValue,
        onQSChange,
        preLoad = true,
        queryFilters,
        queryParams,
        requiredColumns,
        schemaQuery,
        showLoading = true,
        valueColumn,
        ...selectInputProps
    } = props;
    const {
        allowDisable,
        containerClass,
        customTheme,
        customStyles,
        description,
        formsy,
        helpTipRenderer,
        initiallyDisabled,
        inputClass,
        label,
        labelClass,
        menuPosition,
        multiple,
        name,
        onToggleDisable,
        openMenuOnFocus,
        required,
        value,
        hasMixedValue,
    } = selectInputProps;
    const [defaultOptions, setDefaultOptions] = useState<DefaultOptions>(() =>
        // See note in onFocus() regarding support for "loadOnFocus"
        preLoad !== false ? true : loadOnFocus ? [] : true
    );
    const [error, setError] = useState<string>();
    const [loadOnFocusLock, setLoadOnFocusLock] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(undefined);
    const [model, setModel] = useState<QuerySelectModel>(
        () =>
            new QuerySelectModel({
                ...props,
                delimiter,
                isInit: false,
                rawSelectedValue: value !== null ? value : undefined,
            })
    );
    // This persists all searches done prior to the select being fully initialized. Once initialized,
    // these searches are cleared out and resolved. The reason we need to retain these is the underlying
    // SelectInput retains these search results, however, we need be fully initialized to complete a search.
    const [searches, setSearches] = useState<Search[]>([]);
    const debounceTO = useTimeout();
    const shouldLoadOnFocus = loadOnFocus && !loadOnFocusLock;
    const { notFoundValues, selectedOptions } = useMemo(() => {
        const notFoundValues_ = new Set<boolean | number | string>();
        const options = model.isInit ? model.selectedOptions : undefined;

        if (options) {
            if (Array.isArray(options)) {
                options.forEach(option => {
                    if (option.notFound) {
                        notFoundValues_.add(option.displayValue ?? option.value);
                    }
                });
            } else if (options.notFound) {
                notFoundValues_.add(options.displayValue ?? options.value);
            }
        }

        return { notFoundValues: notFoundValues_, selectedOptions: options };
    }, [model]);

    useEffect(() => {
        if (!autoInit) return;
        (async () => {
            try {
                const modelProps = await initSelect({ ...props, delimiter, notFoundValuesEnabled });

                setModel(model_ => {
                    const { selectedItems } = modelProps;

                    if (selectedItems.size) {
                        model_ = model_.merge({
                            allResults: model_.allResults.merge(selectedItems),
                            selectedQuery: parseSelectedQuery(model_, selectedItems),
                        }) as QuerySelectModel;
                    }

                    return model_.merge(modelProps) as QuerySelectModel;
                });
            } catch (e) {
                setError(resolveErrorMessage(e) ?? 'Failed to initialize.');
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoInit]);

    useEffect(() => {
        if (!model.isInit || value === undefined || value === null) return;

        // The following logic is only reached once after the model has been initialized.
        const { rawSelectedValue, selectedItems } = model;

        if (fireQSChangeOnInit && Utils.isFunction(onQSChange)) {
            let selectOptions: SelectInputOption | SelectInputOption[] = formatResults(model, selectedItems);

            // mimic ReactSelect in that it will return a single option if multiple is not true
            if (multiple === false) {
                selectOptions = selectOptions[0];
            }

            onQSChange(name, rawSelectedValue, selectOptions, props, selectedItems);
        }

        // fire listener if given an initial value and a listener function
        if (rawSelectedValue) {
            onInitValue?.(rawSelectedValue, selectedItems.toList());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- should only ever depend on model.isInit
    }, [model.isInit]);

    const fetchResults = useCallback((model_: QuerySelectModel, search: Search): void => {
        const { input, reject, resolve } = search;
        fetchSearchResults(model_, input)
            .then(data => {
                resolve(formatSavedResults(model_, data, input));
                setModel(m => saveSearchResults(m, data));
            })
            .catch(e => {
                const errorMsg = resolveErrorMessage(e) ?? 'Failed to retrieve search results.';
                console.error(errorMsg, e);
                reject(errorMsg);
                setError(errorMsg);
            });
    }, []);

    // Any searches (i.e. calls to loadOptions()) made prior to the select being fully
    // initialized are resolved here after the model has been initialized.
    useEffect(() => {
        if (model.isInit && searches.length > 0) {
            setSearches([]);
            searches.forEach(s => fetchResults(model, s));
        }
    }, [fetchResults, model, searches]);

    const loadOptions = useCallback(
        (input: string): Promise<SelectInputOption[]> => {
            // If loadOptions occurs prior to call to "onFocus" then there is no need to "loadOnFocus".
            if (shouldLoadOnFocus) {
                setLoadOnFocusLock(true);
            }

            debounceTO.clear();

            return new Promise((resolve, reject): void => {
                const search: Search = { input, reject, resolve };

                // If the model is already initialized, then debounce the searches
                if (model.isInit) {
                    debounceTO.set(() => fetchResults(model, search), 250);
                } else {
                    // Otherwise, persist the search to be resolved after the model is initialized
                    setSearches(s => [...s, search]);
                }
            });
        },
        [debounceTO, fetchResults, model, shouldLoadOnFocus]
    );

    const onChange = useCallback<SelectInputChange>(
        (name_, value_, options_, props_) => {
            const model_ = setSelection(model, value_);
            setModel(model_);
            onQSChange?.(name_, value_, options_, props_, model_.selectedItems);
        },
        [model, onQSChange]
    );

    const onFocus = useCallback(async () => {
        // NK: To support loading the select upon focus (a.k.a. "loadOnFocus") we have to explicitly utilize
        // the "defaultOptions" and "isLoading" properties of ReactSelect. These properties, in tandem with
        // "loadOptions", allow for an asynchronous ReactSelect to defer requesting the initial options until
        // desired. This follows the pattern outlined here:
        // https://github.com/JedWatson/react-select/issues/1525#issuecomment-744157380
        if (!shouldLoadOnFocus) return;

        // Set and forget "loadOnFocusLock" state so "loadOnFocus" only occurs on the initial focus.
        setIsLoading(true);
        setLoadOnFocusLock(true);

        try {
            const defaultOptions_ = await loadOptions('');
            setDefaultOptions(defaultOptions_);
            // ReactSelect respects "isLoading" with a value of {undefined} differently from a value of {false}.
            setIsLoading(undefined);
        } catch (e) {
            // ignore -- error already logged/configured in loadOptions()
        }
    }, [loadOptions, shouldLoadOnFocus]);

    const optionRenderer = useCallback(
        option => (
            <OptionRenderer label={option.label} model={model} OptionComponent={OptionComponent} value={option.value} />
        ),
        [OptionComponent, model]
    );

    // Issue 52773: If a value is specified, but we are unable to resolve the value then display a warning to the user.
    const warning = useMemo(() => {
        if (notFoundValues.size === 0) return undefined;
        const warningValue = notFoundValues.size === 1 ? Array.from(notFoundValues)[0] : 'multiple values';
        return lookupValidationErrorMessage(warningValue);
    }, [notFoundValues]);

    if (error) {
        return (
            <SelectInput
                allowDisable={allowDisable}
                containerClass={containerClass}
                customStyles={customStyles}
                customTheme={customTheme}
                description={description}
                disabled
                formsy={formsy}
                hasMixedValue={hasMixedValue}
                helpTipRenderer={helpTipRenderer}
                initiallyDisabled={initiallyDisabled}
                inputClass={inputClass}
                isLoading={false}
                label={label}
                labelClass={labelClass}
                menuPosition={menuPosition}
                multiple={multiple}
                name={name}
                onToggleDisable={onToggleDisable}
                openMenuOnFocus={openMenuOnFocus}
                placeholder={`Error: ${error}`}
                required={required}
            />
        );
    }

    return (
        <SelectInput
            disabled={showLoading && !model.isInit}
            filterOption={noopFilterOptions}
            label={label !== undefined ? label : model.queryInfo?.title}
            {...selectInputProps}
            allowCreate={false}
            autoValue={false} // QuerySelect directly controls value of SelectInput via "selectedOptions"
            cacheOptions
            defaultOptions={defaultOptions}
            delimiter={delimiter}
            isLoading={isLoading}
            loadOptions={loadOptions}
            onChange={onChange}
            onFocus={onFocus}
            optionRenderer={optionRenderer}
            options={undefined} // prevent override
            // Issue 52773: Allow for submission of required fields whose value is not found
            required={notFoundValues.size > 0 ? false : required}
            selectedOptions={displaySelectedOptions ? selectedOptions : undefined}
            value={getValue(model, multiple)} // needed to initialize the Formsy "value" properly
            warning={warning}
        />
    );
});
QuerySelect.displayName = 'QuerySelect';
