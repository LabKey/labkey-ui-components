import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { FormControl } from 'react-bootstrap';


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

        const suffix = isSecondInput ? '-second' : '';

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
                    name={'field-value-date' + suffix}
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

        if (field.jsonType === 'int' || field.jsonType === 'float') {
            return (
                <FormControl
                    className="form-control"
                    step={field.jsonType === 'int' ? 1 : undefined}
                    name={'field-value-text' + suffix}
                    onChange={(event:any) => updateTextFilterFieldValue(event?.target?.value)}
                    type="number"
                    value={null}
                />
            )
        }

        return (
            <input
                className={'form-control'}
                name={'field-value-text' + suffix}
                type="text"
                value={null}
                onChange={updateTextFilterFieldValue}
            />
        );

    }, [field, activeFilterType]);

    const renderFilterTypeInputs = useCallback(() => {
        if (!activeFilterType || !activeFilterType['valueRequired'])
            return null;

        const isBetweenOperator = activeFilterType['betweenOperator'];

        if (!isBetweenOperator)
            return renderFilterTypeInput();

        return (
            <>
                {renderFilterTypeInput()}
                <div>and</div>
                {renderFilterTypeInput(true)}
            </>
        )

    }, [field, activeFilterType]);

    console.log(fieldFilterOptions);

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
            {renderFilterTypeInputs()}
        </>

    );
});

