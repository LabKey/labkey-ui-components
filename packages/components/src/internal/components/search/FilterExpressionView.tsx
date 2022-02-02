import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { FormControl } from 'react-bootstrap';

import { Filter } from '@labkey/api';

import { QueryColumn } from '../../../public/QueryColumn';
import { SelectInput } from '../forms/input/SelectInput';
import { App } from '../../../index';

import { JsonType } from '../domainproperties/PropDescType';
import { formatDate } from '../../util/Date';

import {
    getFilterValuesAsArray,
    getSampleFinderFilterTypesForType,
    getUpdateFilterExpressionFilter,
    isFilterUrlSuffixMatch
} from './utils';
import {FieldFilterOption} from "./models";

interface Props {
    field: QueryColumn;
    fieldFilter: Filter.IFilter; // only one filter supported for v1
    onFieldFilterUpdate?: (newFilter: Filter.IFilter) => void;
}

export const FilterExpressionView: FC<Props> = memo(props => {
    const { field, fieldFilter, onFieldFilterUpdate } = props;

    const [fieldFilterOptions, setFieldFilterOptions] = useState<FieldFilterOption[]>(undefined);
    const [activeFilterType, setActiveFilterType] = useState<FieldFilterOption>(undefined);
    const [firstFilterValue, setFirstFilterValue] = useState<any>();
    const [secondFilterValue, setSecondFilterValue] = useState<any>();

    useEffect(() => {
        const filterOptions = getSampleFinderFilterTypesForType(field?.jsonType as JsonType);
        setFieldFilterOptions(filterOptions);

        if (fieldFilter) {
            const filterOption = filterOptions?.find(option => {
                return isFilterUrlSuffixMatch(option.value, fieldFilter.getFilterType());
            });

            if (filterOption) {
                setActiveFilterType(filterOption);

                const values = getFilterValuesAsArray(fieldFilter);
                if (filterOption.betweenOperator) {
                    setFirstFilterValue(values[0]);
                    setSecondFilterValue(values[1]);
                } else if (values.length > 1) {
                    setFirstFilterValue(values.join(';'));
                } else {
                    setFirstFilterValue(values[0]);
                }
            }
        }
    }, [field]); // leave fieldFilter out of deps list, fieldFilter is used to init once

    const updateFilter = useCallback(
        (newFilterType: FieldFilterOption, previousFirstFilterValue?: any, previousSecondFilterValue?: any, newFilterValue?: any, isSecondValue?: boolean, clearBothValues?: boolean) => {
            const newFilter = getUpdateFilterExpressionFilter(newFilterType, field, previousFirstFilterValue, previousSecondFilterValue, newFilterValue, isSecondValue, clearBothValues);
            onFieldFilterUpdate(newFilter);
        },
        [field]
    );

    const onFieldFilterTypeChange = useCallback(
        (fieldname: any, filterUrlSuffix: any) => {
            const activeFilterType = fieldFilterOptions?.find(option => option.value === filterUrlSuffix);
            setActiveFilterType(activeFilterType);
            setFirstFilterValue(undefined);
            setSecondFilterValue(undefined);
            updateFilter(activeFilterType, undefined, undefined,undefined, undefined, true);
        },
        [fieldFilterOptions]
    );

    const updateBooleanFilterFieldValue = useCallback(
        (event: any) => {
            const newValue = event.target.value;
            setFirstFilterValue(newValue); // boolean columns don't support between operators
            updateFilter(activeFilterType, firstFilterValue, secondFilterValue, newValue, false);
        },
        [activeFilterType]
    );

    const updateTextFilterFieldValue = useCallback(
        (event: any, isNumberInput?: boolean) => {
            const newValue = isNumberInput ? event.target.valueAsNumber : event.target.value;
            const isSecondInput = event.target.name.endsWith('-second');
            if (isSecondInput) setSecondFilterValue(newValue);
            else setFirstFilterValue(newValue);
            updateFilter(activeFilterType, firstFilterValue, secondFilterValue, newValue, isSecondInput);
        },
        [activeFilterType]
    );

    const updateDateFilterFieldValue = useCallback(
        (newValue: any, isSecondInput?: boolean) => {
            const newDate = newValue ? formatDate(newValue) : null;
            if (isSecondInput) setSecondFilterValue(newDate);
            else setFirstFilterValue(newDate);
            updateFilter(activeFilterType, firstFilterValue, secondFilterValue, newDate, isSecondInput);
        },
        [activeFilterType]
    );

    const renderFilterInput = useCallback(
        (firstFilterValue, secondFilterValue, isSecondInput?: boolean) => {
            if (!activeFilterType || !activeFilterType.valueRequired) return null;

            const suffix = isSecondInput ? '-second' : '';
            const valueRaw = isSecondInput ? secondFilterValue : firstFilterValue;

            if (field.jsonType === 'date') {
                return (
                    <DatePicker
                        autoComplete="off"
                        className="form-control search-filter__input"
                        wrapperClassName="form-group search-filter__input-wrapper"
                        selectsEnd
                        isClearable
                        required
                        selected={valueRaw ? new Date(valueRaw) : undefined}
                        name={'field-value-date' + suffix}
                        onChange={newDate => updateDateFilterFieldValue(newDate, isSecondInput)}
                        dateFormat={App.getDateFormat()}
                    />
                );
            } else if (field.jsonType === 'boolean') {
                return (
                    <>
                        <div key="field-value-bool-true">
                            <input
                                checked={valueRaw == 'true'}
                                className=""
                                type="radio"
                                name="field-value-bool"
                                value="true"
                                onChange={updateBooleanFilterFieldValue}
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
                                onChange={updateBooleanFilterFieldValue}
                            />{' '}
                            FALSE
                        </div>
                    </>
                );
            }

            if (field.jsonType === 'int' || field.jsonType === 'float') {
                return (
                    <FormControl
                        className="form-control search-filter__input"
                        step={field.jsonType === 'int' ? 1 : undefined}
                        name={'field-value-text' + suffix}
                        onChange={event => updateTextFilterFieldValue(event, true)}
                        pattern={field.jsonType === 'int' ? '[0-9]*' : undefined}
                        type="number"
                        value={valueRaw ?? ''}
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
                    onChange={updateTextFilterFieldValue}
                    required
                />
            );
        },
        [field, activeFilterType]
    );

    const renderFilterTypeInputs = useCallback(() => {
        if (!activeFilterType || !activeFilterType.valueRequired) return null;

        const isBetweenOperator = activeFilterType.betweenOperator;

        if (!isBetweenOperator) return renderFilterInput(firstFilterValue, secondFilterValue);

        return (
            <>
                {renderFilterInput(firstFilterValue, secondFilterValue)}
                <div className="search-filter__and-op">and</div>
                {renderFilterInput(firstFilterValue, secondFilterValue, true)}
            </>
        );
    }, [field, activeFilterType, firstFilterValue, secondFilterValue]);

    return (
        <>
            <SelectInput
                key="search-parent-field-filter-type"
                name="search-parent-field-filter-type"
                containerClass="form-group search-filter__input-wrapper"
                inputClass="search-filter__input-select"
                placeholder="Select a filter type..."
                value={activeFilterType?.value}
                onChange={onFieldFilterTypeChange}
                options={fieldFilterOptions}
            />
            {renderFilterTypeInputs()}
        </>
    );
});
