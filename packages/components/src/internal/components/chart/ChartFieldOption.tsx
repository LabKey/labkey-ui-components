import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { SelectInput } from '../forms/input/SelectInput';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { LABKEY_VIS } from '../../constants';
import { QueryColumn } from '../../../public/QueryColumn';

import { ChartFieldRangeScaleOptions } from './ChartFieldRangeScaleOptions';
import { ChartConfig, ChartConfigSetter, ChartFieldInfo, ChartTypeInfo, ScaleType } from './models';
import { getFieldDataType, getSelectOptions, hasTrendline, shouldShowAggregateOptions, shouldShowRangeScaleOptions } from './utils';

import { ChartFieldAggregateOptions } from './ChartFieldAggregateOptions';

const DEFAULT_SCALE_VALUES = { type: 'automatic', trans: 'linear' };

interface OwnProps {
    chartConfig: ChartConfig;
    field: ChartFieldInfo;
    model: QueryModel;
    selectedType: ChartTypeInfo;
    setChartConfig: ChartConfigSetter;
}

export const ChartFieldOption: FC<OwnProps> = memo(props => {
    const { chartConfig, field, model, selectedType, setChartConfig } = props;
    const { measures, scales } = chartConfig;
    const scaleValues = scales[field.name] ?? {};
    const fieldValue = measures?.[field.name];
    const [scale, setScale] = useState<ScaleType>(scaleValues?.type ? scaleValues : DEFAULT_SCALE_VALUES);
    const options = useMemo(() => getSelectOptions(model, selectedType, field), [model, selectedType, field]);
    const isNumericType = useMemo(
        () => LABKEY_VIS.GenericChartHelper.isNumericType(getFieldDataType(fieldValue)),
        [fieldValue]
    );
    const showRangeScaleOptions = isNumericType && shouldShowRangeScaleOptions(field, selectedType);
    const showAggregateOptions = isNumericType && shouldShowAggregateOptions(field, selectedType);

    const onScaleChange = useCallback(
        (field: string, key: string, value: number | string, reset = false) => {
            setChartConfig(current => {
                const scales = current.scales ? { ...current.scales } : {};
                if (!scales[field] || reset) scales[field] = DEFAULT_SCALE_VALUES;
                if (key) scales[field][key] = value;
                return { ...current, scales };
            });
        },
        [setChartConfig]
    );

    const onSelectChange = useCallback(
        (name: string, _: never, col: QueryColumn) => {
            setScale(DEFAULT_SCALE_VALUES);
            setChartConfig(current => {
                let geomOptions = current.geomOptions;
                const measures = { ...current.measures };
                const scales = { ...current.scales };

                if (!col) {
                    delete measures[name];
                    delete scales[name];
                } else {
                    measures[name] = {
                        fieldKey: col.fieldKey,
                        label: col.caption,
                        name: col.name,
                        type: col.jsonType,
                    };
                    scales[name] = DEFAULT_SCALE_VALUES;
                }

                if (name === 'x' && hasTrendline(selectedType)) {
                    const trendlineType = LABKEY_VIS.GenericChartHelper.TRENDLINE_OPTIONS[''];
                    geomOptions = { ...geomOptions, trendlineType };
                }

                return { ...current, geomOptions, measures };
            });
        },
        [selectedType, setChartConfig]
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
                    labelKey="caption"
                    name={field.name}
                    onChange={onSelectChange}
                    options={options}
                    placeholder="Select a field"
                    showLabel={false}
                    // Issue 52050: use fieldKey for special characters
                    value={fieldValue?.fieldKey}
                    valueKey="fieldKey"
                />
                {showRangeScaleOptions && (
                    <ChartFieldRangeScaleOptions
                        field={field}
                        onScaleChange={onScaleChange}
                        scale={scale}
                        setScale={setScale}
                        showScaleTrans={selectedType.name !== 'bar_chart'}
                    >
                        {fieldValue && showAggregateOptions && (
                            <ChartFieldAggregateOptions
                                asOverlay={false}
                                chartConfig={chartConfig}
                                field={field}
                                selectedType={selectedType}
                                setChartConfig={setChartConfig}
                            />
                        )}
                    </ChartFieldRangeScaleOptions>
                )}
            </div>
        </div>
    );
});
ChartFieldOption.displayName = 'ChartFieldOption';
