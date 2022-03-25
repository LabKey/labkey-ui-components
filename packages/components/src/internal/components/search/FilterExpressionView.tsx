import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { FormControl } from 'react-bootstrap';

import { Filter } from '@labkey/api';

import { QueryColumn } from '../../../public/QueryColumn';
import { SelectInput } from '../forms/input/SelectInput';
import { App, formatDateTime, parseDate } from '../../../index';

import { JsonType } from '../domainproperties/PropDescType';
import { formatDate, isDateTimeCol } from '../../util/Date';

import {
    getFilterForFilterSelection,
    getFilterSelections,
    getFilterTypePlaceHolder,
    getSampleFinderFilterTypesForType, getUpdatedFilters,
    getUpdateFilterExpressionFilter,
} from './utils';
import { FieldFilterOption, FilterSelection } from './models';

interface Props {
    field: QueryColumn;
    fieldFilters: Filter.IFilter[];
    onFieldFilterUpdate?: (newFilters: Filter.IFilter[], index: number) => void;
}

export const FilterExpressionView: FC<Props> = memo(props => {
    const { field, fieldFilters, onFieldFilterUpdate } = props;

    const [fieldFilterOptions, setFieldFilterOptions] = useState<FieldFilterOption[]>(undefined);
    const [activeFilters, setActiveFilters] = useState<FilterSelection[]>([]);
    const [removeFilterCount, setRemoveFilterCount] = useState<number>(0);

    useEffect(() => {
        const filterOptions = getSampleFinderFilterTypesForType(field?.getDisplayFieldJsonType() as JsonType);
        setFieldFilterOptions(filterOptions);
        setActiveFilters(getFilterSelections(fieldFilters, filterOptions));
    }, [field]); // leave fieldFilters out of deps list, fieldFilters is used to init once

    const unusedFilterOptions = useCallback(
        (thisIndex: number): FieldFilterOption[] => {
            const otherIndex = thisIndex == 1 ? 0 : 1;
            return fieldFilterOptions?.filter(
                option =>
                    (thisIndex == 0 || !option.isSoleFilter) &&
                    activeFilters[otherIndex]?.filterType.value !== option.value
            );
        },
        [fieldFilterOptions, activeFilters]
    );

    const updateFilter = useCallback(
        (
            filterIndex: number,
            newFilterType: FieldFilterOption,
            newFilterValue?: any,
            isSecondValue?: boolean,
            clearBothValues?: boolean
        ) => {
            onFieldFilterUpdate(getUpdatedFilters(field, activeFilters, filterIndex, newFilterType, newFilterValue, isSecondValue, clearBothValues), filterIndex);
        },
        [field, activeFilters]
    );

    const updateActiveFilters = useCallback(
        (filterIndex: number, newFilterSelection: Partial<FilterSelection>) => {
            const filterSelection = {
                ...activeFilters[filterIndex],
                ...newFilterSelection,
            };

            if (filterSelection.filterType) {
                if (filterSelection.filterType.isSoleFilter) {
                    setActiveFilters([filterSelection]);
                } else {
                    setActiveFilters(currentFilters => {
                        return [
                            ...currentFilters.slice(0, filterIndex),
                            filterSelection,
                            ...currentFilters.slice(filterIndex + 1),
                        ];
                    });
                }
            } else {
                setActiveFilters(currentFilters => {
                    return [...currentFilters.slice(0, filterIndex), ...currentFilters.slice(filterIndex + 1)];
                });
                // When a filter is removed, we need to recreate the selectInputs so they pick up the value from the
                // filter that got shifted into the place that was removed. This doesn't happen through normal channels
                // because this is part of the onChange callback for the selectInput, and it has protections against
                // infinitely updating as a result of the onChange action.
                setRemoveFilterCount(count => count + 1);
            }
        },
        [activeFilters]
    );

    const onFieldFilterTypeChange = useCallback(
        (fieldname: any, filterUrlSuffix: any, filterIndex: number) => {
            const newActiveFilterType = fieldFilterOptions?.find(option => option.value === filterUrlSuffix);

            let firstValue = activeFilters[filterIndex]?.firstFilterValue;
            // when a value is required, we want to start with 'undefined' instead of 'null' since 'null' is seen as a valid value
            if (newActiveFilterType.valueRequired && !activeFilters[filterIndex]?.filterType.valueRequired) {
                firstValue = undefined;
            } else if (!newActiveFilterType.valueRequired) { // if value is not required, then we'll start with null
                firstValue = null;
            }
            const newFilterSelection = {
                filterType: newActiveFilterType,
                firstFilterValue: firstValue,
                secondFilterValue: activeFilters[filterIndex]?.secondFilterValue,
            };
            const shouldClear =
                !newActiveFilterType?.valueRequired ||
                (activeFilters[filterIndex]?.filterType?.multiValue && !newActiveFilterType.multiValue);

            if (shouldClear) {
                newFilterSelection.firstFilterValue = undefined;
                newFilterSelection.secondFilterValue = undefined;
            }

            updateFilter(
                filterIndex,
                newActiveFilterType,
                shouldClear ? undefined : newFilterSelection.firstFilterValue,
                undefined,
                shouldClear
            );
            updateActiveFilters(filterIndex, newFilterSelection);
        },
        [fieldFilterOptions, activeFilters]
    );

    const updateBooleanFilterFieldValue = useCallback(
        (filterIndex: number, event: any) => {
            const newValue = event.target.value;

            updateFilter(filterIndex, activeFilters[filterIndex]?.filterType, newValue, false);
            updateActiveFilters(filterIndex, { firstFilterValue: newValue }); // boolean columns don't support between operators
        },
        [activeFilters]
    );

    const updateTextFilterFieldValue = useCallback(
        (filterIndex, event: any, isNumberInput?: boolean) => {
            let newValue = isNumberInput ? event.target.valueAsNumber : event.target.value;
            if (isNumberInput && isNaN(newValue)) newValue = null;
            const isSecondInput = event.target.name.endsWith('-second');
            const update: Partial<FilterSelection> = {};
            if (isSecondInput) {
                update.secondFilterValue = newValue;
            } else {
                update.firstFilterValue = newValue;
            }

            updateFilter(filterIndex, activeFilters[filterIndex]?.filterType, newValue, isSecondInput);
            updateActiveFilters(filterIndex, update);
        },
        [activeFilters]
    );

    const updateDateFilterFieldValue = useCallback(
        (filterIndex: number, newValue: any, isTime: boolean, isSecondInput?: boolean) => {
            const newDate = newValue ? (isTime ? formatDateTime(newValue) : formatDate(newValue)) : null;
            const update: Partial<FilterSelection> = {};
            if (isSecondInput) {
                update.secondFilterValue = newDate;
            } else {
                update.firstFilterValue = newDate;
            }

            updateFilter(filterIndex, activeFilters[filterIndex]?.filterType, newDate, isSecondInput);
            updateActiveFilters(filterIndex, update);
        },
        [activeFilters]
    );

    const renderFilterInput = useCallback(
        (placeholder: string, filterIndex: number, isMultiValueInput?: boolean, isSecondInput?: boolean) => {
            const { filterType, firstFilterValue, secondFilterValue } = activeFilters[filterIndex];
            if (!filterType || !filterType.valueRequired) return null;

            const suffix = isSecondInput ? '-second' : '';
            const valueRaw = isSecondInput ? secondFilterValue : firstFilterValue;

            const jsonType = field.getDisplayFieldJsonType();
            if (jsonType === 'date') {
                const showTimeStamp = isDateTimeCol(field);
                return (
                    <DatePicker
                        autoComplete="off"
                        className="form-control search-filter__input"
                        wrapperClassName="form-group search-filter__input-wrapper"
                        selectsEnd
                        isClearable
                        required
                        selected={valueRaw ? parseDate(valueRaw) : undefined}
                        name={'field-value-date-' + filterIndex + suffix}
                        onChange={newDate =>
                            updateDateFilterFieldValue(filterIndex, newDate, showTimeStamp, isSecondInput)
                        }
                        dateFormat={showTimeStamp ? App.getDateTimeFormat() : App.getDateFormat()}
                        showTimeSelect={showTimeStamp}
                    />
                );
            } else if (jsonType === 'boolean') {
                return (
                    <>
                        <div key="field-value-bool-true">
                            <input
                                checked={valueRaw == 'true'}
                                className=""
                                type="radio"
                                name="field-value-bool"
                                value="true"
                                onChange={event => updateBooleanFilterFieldValue(filterIndex, event)}
                            />{' '}
                            TRUE
                        </div>
                        <div key="field-value-bool-false">
                            <input
                                checked={valueRaw != 'true'}
                                className=""
                                type="radio"
                                name="field-value-bool"
                                value="false"
                                onChange={event => updateBooleanFilterFieldValue(filterIndex, event)}
                            />{' '}
                            FALSE
                        </div>
                    </>
                );
            }

            if (!isMultiValueInput && (jsonType === 'int' || jsonType === 'float')) {
                return (
                    <FormControl
                        className="form-control search-filter__input"
                        step={jsonType === 'int' ? 1 : undefined}
                        name={'field-value-text' + suffix}
                        onChange={event => updateTextFilterFieldValue(filterIndex, event, true)}
                        pattern={jsonType === 'int' ? '-?[0-9]*' : undefined}
                        type="number"
                        value={valueRaw ?? ''}
                        placeholder={placeholder}
                        required
                    />
                );
            }

            return (
                <input
                    className="form-control search-filter__input"
                    name={'field-value-text' + suffix}
                    type="text"
                    value={valueRaw ?? ''}
                    onChange={event => updateTextFilterFieldValue(filterIndex, event)}
                    placeholder={placeholder}
                    required
                />
            );
        },
        [field, activeFilters]
    );

    const renderFilterTypeInputs = useCallback(
        (filterIndex: number) => {
            if (filterIndex >= activeFilters.length) return null;

            const { filterType } = activeFilters[filterIndex];
            if (!filterType || !filterType.valueRequired) return null;

            const isBetweenOperator = filterType.betweenOperator;
            const isMultiValueInput = filterType.value === 'in' || filterType.value === 'notin';
            const placeholder = getFilterTypePlaceHolder(filterType.value, field.getDisplayFieldJsonType());

            if (!isBetweenOperator) return renderFilterInput(placeholder, filterIndex, isMultiValueInput);

            return (
                <>
                    {renderFilterInput(placeholder, filterIndex, isMultiValueInput)}
                    <div className="search-filter__and-op">and</div>
                    {renderFilterInput(placeholder, filterIndex, isMultiValueInput, true)}
                </>
            );
        },
        [field, activeFilters]
    );

    const shouldShowSecondFilter = useCallback((): boolean => {
        if (!activeFilters?.length) return false;

        if (activeFilters[0].filterType.isSoleFilter) return false;

        if (!activeFilters[0].filterType.valueRequired) return true;

        if (activeFilters[0].firstFilterValue === undefined) return false;

        return !activeFilters[0].filterType.betweenOperator || activeFilters[0].secondFilterValue !== undefined;
    }, [activeFilters]);

    return (
        <>
            <SelectInput
                key={'search-parent-field-filter-type-' + removeFilterCount} // we need to recreate this component when a filter is removed
                name="search-parent-field-filter-type"
                containerClass="form-group search-filter__input-wrapper"
                inputClass="search-filter__input-select"
                placeholder="Select a filter type..."
                value={activeFilters[0]?.filterType?.value}
                onChange={(fieldname: any, filterUrlSuffix: any) =>
                    onFieldFilterTypeChange(fieldname, filterUrlSuffix, 0)
                }
                options={unusedFilterOptions(0)}
            />
            {renderFilterTypeInputs(0)}
            {shouldShowSecondFilter() && (
                <>
                    <div className="parent-search-panel__col-sub-title">and</div>
                    <SelectInput
                        key="search-parent-field-filter-type"
                        name="search-parent-field-filter-type"
                        containerClass="form-group search-filter__input-wrapper"
                        inputClass="search-filter__input-select"
                        placeholder="Select a filter type..."
                        value={activeFilters[1]?.filterType?.value}
                        onChange={(fieldname: any, filterUrlSuffix: any) =>
                            onFieldFilterTypeChange(fieldname, filterUrlSuffix, 1)
                        }
                        options={unusedFilterOptions(1)}
                    />
                    {renderFilterTypeInputs(1)}
                </>
            )}
        </>
    );
});
