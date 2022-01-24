import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { FormControl } from 'react-bootstrap';

import { Filter } from "@labkey/api";

import { QueryColumn } from "../../../public/QueryColumn";
import { SelectInput } from "../forms/input/SelectInput";
import { App } from "../../../index";
import { getSampleFinderFilterTypesForType } from "./utils";
import { JsonType } from "../domainproperties/PropDescType";
import {resolveFieldKey} from "../omnibox/utils";
import {resolveFilterType} from "../omnibox/actions/Filter";

interface Props {
    key: string
    field: QueryColumn
    fieldFilter: Filter.IFilter // only one filter supported for v1
    onFieldFilterUpdate?: (newFilter: Filter.IFilter) => void
}

export const FilterExpressionView: FC<Props> = memo(props => {
    const { field, fieldFilter, onFieldFilterUpdate } = props;

    const [fieldFilterOptions, setFieldFilterOptions] = useState<any[]>(undefined);
    const [activeFilterType, setActiveFilterType] = useState<any[]>(undefined);
    const [firstFilterValue, setFirstFilterValue] = useState<any>();
    const [secondFilterValue, setSecondFilterValue] = useState<any>();
    const [activeFilter, setActiveFilter] = useState<Filter.IFilter>(fieldFilter);

    useEffect(() => {
        const filterOptions = getSampleFinderFilterTypesForType(field?.jsonType as JsonType);
        setFieldFilterOptions(filterOptions);

        if (fieldFilter) {
            const filterOption = filterOptions?.find(option => option.value === fieldFilter.getFilterType().getURLSuffix());
            setActiveFilterType(filterOption);
            const rawFilterValue = fieldFilter.getValue();
            if (filterOption['betweenOperator']) {
                const values = rawFilterValue.split(',');
                setFirstFilterValue(values[0]);
                setSecondFilterValue(values[1]);
            }
            else {
                setFirstFilterValue(rawFilterValue);
            }
        }

    }, [field]); // leave fieldFilter out of deps list, fieldFilter is used to init once

    const updateFilter = useCallback((newFilterType: any[], newFilterValue?: any, isSecondValue?: boolean) => {
        if (!newFilterType) {
            setActiveFilter(undefined);
            onFieldFilterUpdate(undefined);
            return;
        }

        const filterType = resolveFilterType(newFilterType?.['value'], field);
        let filter = null;

        if (!newFilterType['valueRequired']) {
            filter = Filter.create(resolveFieldKey(field.name, field), null, filterType);
        }
        else {
            let value = newFilterValue;
            if (newFilterType?.['betweenOperator']) {
                if (isSecondValue) {
                    value = (firstFilterValue ? firstFilterValue + ',' : '') + newFilterValue;
                }
                else {
                    value = newFilterValue + (secondFilterValue ? ',' + secondFilterValue : '');
                }
            }
            else if (!value && field.jsonType === 'boolean')
                value = false;

            filter = Filter.create(resolveFieldKey(field.name, field), value, filterType);
        }

        setActiveFilter(filter);
        onFieldFilterUpdate(filter);
    }, [field, firstFilterValue, secondFilterValue]);

    const onFieldFilterTypeChange = useCallback((fieldname: any, filterUrlSuffix: any) => {
        const activeFilterType = fieldFilterOptions?.find(option => option.value === filterUrlSuffix);
        setActiveFilterType(activeFilterType);
        setFirstFilterValue(undefined);
        setSecondFilterValue(undefined);
        updateFilter(activeFilterType, undefined, undefined);
    }, [fieldFilterOptions]);

    const updateBooleanFilterFieldValue = useCallback((event: any) => {
        const newValue = event.target.value;
        setFirstFilterValue(newValue);
        updateFilter(activeFilterType, newValue, false);
    }, [activeFilterType]);

    const updateTextFilterFieldValue = useCallback((event: any) => {
        const newValue = event.target.value;
        const isSecondInput = event.target.name.endsWith("-second");
        if (isSecondInput)
            setSecondFilterValue(newValue);
        else
            setFirstFilterValue(newValue);
        updateFilter(activeFilterType, newValue, isSecondInput);
    }, [activeFilterType, firstFilterValue, secondFilterValue]);

    const updateDateFilterFieldValue = useCallback((newValue: any, isSecondInput?: boolean) => {
        // todo fix date conversion?
        if (isSecondInput)
            setSecondFilterValue(newValue);
        else
            setFirstFilterValue(newValue);
        updateFilter(activeFilterType, newValue, isSecondInput);
    }, []);

    const renderFilterTypeInput = useCallback((isSecondInput?: boolean) => {
        if (!activeFilterType || !activeFilterType['valueRequired'])
            return null;

        const suffix = isSecondInput ? '-second' : '';
        let valueRaw = isSecondInput ? secondFilterValue : firstFilterValue;

        if (field.jsonType === "date") {
            return (
                <DatePicker
                    autoComplete={'off'}
                    className={'form-control search-filter-input'}
                    wrapperClassName={'form-group search-filter-input-wrapper'}
                    selectsEnd
                    isClearable
                    required
                    selected={valueRaw ? new Date(valueRaw) : undefined}
                    name={'field-value-date' + suffix}
                    onChange={(newDate) => updateDateFilterFieldValue(newDate, isSecondInput)}
                    dateFormat={App.getDateFormat()}/>
            )
        }
        else if (field.jsonType === "boolean") {
            return (
                <>
                    <div key='field-value-bool-true'>
                        <input
                            checked={'true' == valueRaw}
                            className={""}
                            type="radio"
                            name='field-value-bool'
                            value={'true'}
                            onChange={updateBooleanFilterFieldValue}
                        /> TRUE
                    </div>
                    <div key='field-value-bool-false'>
                        <input
                            checked={'true' != valueRaw}
                            className={""}
                            type="radio"
                            name='field-value-bool'
                            value={'false'}
                            onChange={updateBooleanFilterFieldValue}
                        /> FALSE
                    </div>
                </>
            )
        }

        if (field.jsonType === 'int' || field.jsonType === 'float') {
            return (
                <FormControl
                    className="form-control search-filter-input"
                    step={field.jsonType === 'int' ? 1 : undefined}
                    name={'field-value-text' + suffix}
                    onChange={updateTextFilterFieldValue}
                    pattern={field.jsonType === 'int' ? '[0-9]*' : undefined}
                    type="number"
                    value={valueRaw}
                    required
                />
            )
        }

        return (
            <input
                className={'form-control search-filter-input'}
                name={'field-value-text' + suffix}
                type="text"
                value={valueRaw}
                onChange={updateTextFilterFieldValue}
                required
            />
        );

    }, [field, activeFilterType, firstFilterValue, secondFilterValue]);

    const renderFilterTypeInputs = useCallback(() => {
        if (!activeFilterType || !activeFilterType['valueRequired'])
            return null;

        const isBetweenOperator = activeFilterType['betweenOperator'];

        if (!isBetweenOperator)
            return renderFilterTypeInput();

        return (
            <>
                {renderFilterTypeInput()}
                <div className='search-filter-and'>and</div>
                {renderFilterTypeInput(true)}
            </>
        )

    }, [field, activeFilterType, firstFilterValue, secondFilterValue]);

    return (
        <>
            <SelectInput
                key="search-parent-field-filter-type"
                name="search-parent-field-filter-type"
                containerClass='form-group search-filter-input-wrapper'
                inputClass='search-filter-input-select'
                placeholder="Select a filter type..."
                value={activeFilterType?.['value']}
                onChange={onFieldFilterTypeChange}
                options={fieldFilterOptions}
            />
            {renderFilterTypeInputs()}
        </>

    );
});

