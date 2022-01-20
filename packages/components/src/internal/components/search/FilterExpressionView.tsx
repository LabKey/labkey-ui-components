import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';

import { Filter } from "@labkey/api";

import { QueryColumn } from "../../../public/QueryColumn";
import { SelectInput } from "../forms/input/SelectInput";
import { App } from "../../../index";
import { getSampleFinderFilterTypesForType } from "./utils";
import { JsonType } from "../domainproperties/PropDescType";

interface Props {
    field: QueryColumn
    fieldFilter: Filter.IFilter // only one filter supported for v1
}

export const FilterExpressionView: FC<Props> = memo(props => {
    const { field, fieldFilter } = props;

    const [fieldFilterOptions, setFieldFilterOptions] = useState<any[]>(undefined);
    const [activeFilterType, setActiveFilterType] = useState<any[]>(undefined);


    useEffect(() => {
        const filterOptions = getSampleFinderFilterTypesForType(field?.jsonType as JsonType);
        setFieldFilterOptions(filterOptions);
    }, [field]);

    const onFieldFilterTypeChange = useCallback((fieldname: any, filterUrlSuffix: any) => {
        const activeFilterType = fieldFilterOptions?.find(option => option.value === filterUrlSuffix);
        setActiveFilterType(activeFilterType);
    }, [fieldFilterOptions]);

    const updateBooleanFilterFieldValue = useCallback((value: any) => {
        console.log(value)
    }, []);

    const updateTextFilterFieldValue = useCallback((value: any) => {
        console.log(value)
    }, []);

    const updateDateFilterFieldValue = useCallback((value: any) => {
        console.log(value)
    }, []);

    const renderFilterTypeInput = useCallback((isSecondInput?: boolean) => {
        if (!activeFilterType || !activeFilterType['valueRequired'])
            return null;

        if (field.jsonType === "date") {
            return (
                <DatePicker
                    autoComplete={'off'}
                    className={'form-control'}
                    wrapperClassName={'row'}
                    selectsEnd
                    isClearable
                    selected={null}
                    startDate={null}
                    endDate={null}
                    name={'field-value-date'}
                    onChange={updateDateFilterFieldValue}
                    minDate={null}
                    dateFormat={App.getDateFormat()}/>
            )
        }
        else if (field.jsonType === "boolean") {
            return (
                <>
                    <div key='field-value-bool-true'>
                        <input
                            checked={true}
                            className={""}
                            type="radio"
                            name='field-value-bool'
                            value={'true'}
                            onChange={updateBooleanFilterFieldValue}
                        /> TRUE
                    </div>
                    <div key='field-value-bool-false'>
                        <input
                            checked={false}
                            className={""}
                            type="radio"
                            name='field-value-bool'
                            value={'false'}
                            onChange={updateBooleanFilterFieldValue}
                        /> NO
                    </div>
                </>
            )
        }

        return (
            <input
                className={'form-control'}
                name={'field-value-text' + (isSecondInput ? '-second' : '')}
                type="text"
                value={null}
                onChange={updateTextFilterFieldValue}
            />
        );

    }, [field, activeFilterType]);

    return (
        <>
            <SelectInput
                key="search-parent-field-filter-type"
                name="search-parent-field-filter-type"
                placeholder="Select a filter type..."
                value={fieldFilter?.getFilterType()?.getURLSuffix()}
                onChange={onFieldFilterTypeChange}
                options={fieldFilterOptions}
            />
            {renderFilterTypeInput()}
        </>

    );
});

