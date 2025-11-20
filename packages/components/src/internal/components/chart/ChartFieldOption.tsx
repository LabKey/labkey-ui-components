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
    const measure = measures?.[field.name];
    const [scale, setScale] = useState<ScaleType>(() => {
        return scales[field.name] ?? DEFAULT_SCALE_VALUES;
    });
    const options = useMemo(() => getSelectOptions(model, selectedType, field), [model, selectedType, field]);
    const isNumericType = useMemo(
        () => LABKEY_VIS.GenericChartHelper.isNumericType(getFieldDataType(measure)),
        [measure]
    );
    const showRangeScaleOptions = isNumericType && shouldShowRangeScaleOptions(field, selectedType);
    const showAggregateOptions = isNumericType && shouldShowAggregateOptions(field, selectedType);

    const onScaleChange = useCallback(
        (scale: ScaleType, localOnly = false) => {
            setScale(current => ({ ...current, ...scale }));

            if (!localOnly) {
                setChartConfig(current => {
                    let updatedScale = current.scales?.[field.name] ?? DEFAULT_SCALE_VALUES;
                    updatedScale = { ...updatedScale, ...scale };
                    return { ...current, scales: { ...current.scales, [field.name]: updatedScale } };
                });
            }
        },
        [field.name, setChartConfig]
    );

    const onSelectChange = useCallback(
        (name: string, _: never, col: QueryColumn) => {
            setScale(DEFAULT_SCALE_VALUES);
            setChartConfig(current => {
                let geomOptions = current.geomOptions;
                const measures = { ...current.measures };
                const scales = { ...current.scales };
                const labels = { ...current.labels };

                if (!col) {
                    delete measures[name];
                    delete scales[name];
                    delete labels[name];
                } else {
                    measures[name] = {
                        fieldKey: col.fieldKey,
                        label: col.caption,
                        name: col.name,
                        type: col.jsonType,
                    };
                    scales[name] = DEFAULT_SCALE_VALUES;
                    labels[name] = col.caption;
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
                    value={measure?.fieldKey}
                    valueKey="fieldKey"
                />
                {showRangeScaleOptions && (
                    <ChartFieldRangeScaleOptions
                        onScaleChange={onScaleChange}
                        scale={scale}
                        showScaleTrans={selectedType.name !== 'bar_chart'}
                    >
                        {measure && showAggregateOptions && (
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
