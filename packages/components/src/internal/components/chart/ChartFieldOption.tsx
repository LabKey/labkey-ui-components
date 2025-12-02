import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { SelectInput } from '../forms/input/SelectInput';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { LABKEY_VIS } from '../../constants';
import { QueryColumn } from '../../../public/QueryColumn';

import { ChartConfig, ChartConfigSetter, ChartFieldInfo, ChartLabels, ChartTypeInfo, ScaleType } from './models';
import { getBarChartAxisLabel, getSelectOptions, hasTrendline } from './utils';

import { ChartFieldAdditionalOptions } from './ChartFieldAdditionalOptions';

const DEFAULT_SCALE_VALUES = { type: 'automatic', trans: 'linear' };

interface OwnProps {
    chartConfig: ChartConfig;
    field: ChartFieldInfo;
    model: QueryModel;
    onLabelChange: (key: keyof ChartLabels, value: string) => void;
    selectedType: ChartTypeInfo;
    setChartConfig: ChartConfigSetter;
}

export const ChartFieldOption: FC<OwnProps> = memo(props => {
    const { chartConfig, field, model, onLabelChange, selectedType, setChartConfig } = props;
    const { measures, scales } = chartConfig;
    const measure = measures?.[field.name];
    const [scale, setScale] = useState<ScaleType>(() => {
        return scales[field.name] ?? DEFAULT_SCALE_VALUES;
    });
    const options = useMemo(() => getSelectOptions(model, selectedType, field), [model, selectedType, field]);
    const isPieChart = selectedType.name === 'pie_chart';
    const showAdditionalOptions = !isPieChart && measure && (field.name === 'x' || field.name === 'y');

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
                    const trendlineType = LABKEY_VIS.GenericChartHelper.TRENDLINE_OPTIONS[''].value;
                    geomOptions = { ...geomOptions, trendlineType };
                }

                const updatedConfig = { ...current, geomOptions, measures, labels };

                if (selectedType.name === 'bar_chart') {
                    updatedConfig.labels.y = getBarChartAxisLabel(updatedConfig, current);
                }

                return updatedConfig;
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
                    inputClass={showAdditionalOptions ? 'col-xs-11' : 'col-xs-12'}
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
                {showAdditionalOptions && (
                    <ChartFieldAdditionalOptions
                        chartConfig={chartConfig}
                        field={field}
                        onLabelChange={onLabelChange}
                        onScaleChange={onScaleChange}
                        scale={scale}
                        selectedType={selectedType}
                        setChartConfig={setChartConfig}
                    />
                )}
            </div>
        </div>
    );
});
ChartFieldOption.displayName = 'ChartFieldOption';
