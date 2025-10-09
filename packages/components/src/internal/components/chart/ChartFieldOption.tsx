import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { LABKEY_VIS } from '../../constants';
import { naturalSortByProperty } from '../../../public/sort';

import { ChartFieldRangeScaleOptions } from './ChartFieldRangeScaleOptions';
import { ChartFieldInfo, ChartTypeInfo } from './models';
import { getFieldDataType, shouldShowAggregateOptions, shouldShowRangeScaleOptions } from './utils';
import { ChartFieldAggregateOptions } from './ChartFieldAggregateOptions';

export const getSelectOptions = (
    model: QueryModel,
    chartType: ChartTypeInfo,
    field: ChartFieldInfo
): SelectInputOption[] => {
    const allowableTypes = LABKEY_VIS.GenericChartHelper.getAllowableTypes(field);

    return model.queryInfo
        .getDisplayColumns(model.viewName)
        .filter(col => {
            const colType = getFieldDataType(col);
            const hasMatchingType = allowableTypes.indexOf(colType) > -1;
            const isMeasureDimensionMatch = LABKEY_VIS.GenericChartHelper.isMeasureDimensionMatch(
                chartType.name,
                field,
                col.measure,
                col.dimension
            );
            return hasMatchingType || isMeasureDimensionMatch;
        })
        .sort(naturalSortByProperty('caption'))
        .map(col => ({ label: col.caption, value: col.fieldKey, data: col }));
};

const DEFAULT_SCALE_VALUES = { type: 'automatic', trans: 'linear' };

interface ChartFieldOptionProps {
    field: ChartFieldInfo;
    fieldValues?: Record<string, SelectInputOption>;
    model: QueryModel;
    onErrorBarChange: (name: string, value: string) => void;
    onScaleChange: (field: string, key: string, value: number | string, reset?: boolean) => void;
    onSelectFieldChange: (name: string, value: string, selectedOption: SelectInputOption) => void;
    scaleValues?: Record<string, number | string>;
    selectedType: ChartTypeInfo;
}

export const ChartFieldOption: FC<ChartFieldOptionProps> = memo(props => {
    const {
        field,
        model,
        selectedType,
        onSelectFieldChange,
        scaleValues,
        fieldValues,
        onScaleChange,
        onErrorBarChange,
    } = props;
    const fieldValue = fieldValues?.[field.name];
    const [scale, setScale] = useState<Record<string, number | string>>(scaleValues ?? {});

    const options = useMemo(() => getSelectOptions(model, selectedType, field), [model, selectedType, field]);
    const isNumericType = useMemo(
        () => LABKEY_VIS.GenericChartHelper.isNumericType(getFieldDataType(fieldValue?.data)),
        [fieldValue?.data]
    );
    const showRangeScaleOptions = isNumericType && shouldShowRangeScaleOptions(field, selectedType);
    const showAggregateOptions = isNumericType && shouldShowAggregateOptions(field, selectedType);

    // Issue 52050: use fieldKey for special characters
    const selectInputValue = useMemo(() => fieldValue?.data.fieldKey ?? fieldValue?.value, [fieldValue]);

    useEffect(() => {
        if (showRangeScaleOptions && !scale.type) {
            setScale(scaleValues?.type ? scaleValues : DEFAULT_SCALE_VALUES);
        }
    }, [showRangeScaleOptions, scale.type, scaleValues]);

    const onSelectFieldChange_ = useCallback(
        (name: string, value: string, selectedOption: SelectInputOption) => {
            onScaleChange(field.name, undefined, undefined, true);
            setScale(DEFAULT_SCALE_VALUES);
            onSelectFieldChange(name, value, selectedOption);
        },
        [field.name, onScaleChange, onSelectFieldChange]
    );

    return (
        <div>
            <label>
                {field.label}
                {field.required && ' *'}
            </label>
            <div className="form-group row">
                <SelectInput
                    containerClass=""
                    inputClass={showRangeScaleOptions || showAggregateOptions ? 'col-xs-11' : 'col-xs-12'}
                    name={field.name}
                    onChange={onSelectFieldChange_}
                    options={options}
                    placeholder="Select a field"
                    showLabel={false}
                    value={selectInputValue}
                />
                {showRangeScaleOptions && (
                    <ChartFieldRangeScaleOptions
                        field={field}
                        onScaleChange={onScaleChange}
                        scale={scale}
                        setScale={setScale}
                    />
                )}
                {showAggregateOptions && (
                    <ChartFieldAggregateOptions
                        field={field}
                        fieldValues={fieldValues}
                        onErrorBarChange={onErrorBarChange}
                        onSelectFieldChange={onSelectFieldChange}
                    />
                )}
            </div>
        </div>
    );
});
ChartFieldOption.displayName = 'ChartFieldOption';
