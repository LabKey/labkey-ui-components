import React, { FC, memo, useCallback, useMemo } from 'react';
import { RadioGroupInput } from '../forms/input/RadioGroupInput';

import { ChartConfig, ChartConfigSetter, ChartFieldInfo, ChartTypeInfo } from './models';
import { LabelOverlay } from '../forms/LabelOverlay';
import { SelectInput } from '../forms/input/SelectInput';
import { Utils } from '@labkey/api';
import { getBarChartAxisLabel } from './utils';
import { AGGREGATE_METHODS } from './constants';

const BAR_CHART_AGGREGATE_METHOD_TIP =
    'The aggregate method that will be used to determine the bar height for a given x-axis category / dimension. Field values that are blank are not included in calculated aggregate values.';
const BAR_CHART_ERROR_BAR_TIP =
    "Show error bars on each bar representing Standard Deviation or Standard Error of the Mean. Only applicable for 'Mean' aggregate method.";

const ERROR_BAR_TYPES = [
    { value: undefined, label: 'None' },
    { value: 'SD', label: 'Standard Deviation' },
    { value: 'SEM', label: 'Standard Error of the Mean' },
];

interface OwnProps {
    chartConfig: ChartConfig;
    field: ChartFieldInfo;
    selectedType: ChartTypeInfo;
    setChartConfig: ChartConfigSetter;
}

export const ChartFieldAggregateOptions: FC<OwnProps> = memo(props => {
    const { chartConfig, field, selectedType, setChartConfig } = props;
    const yMeasure = Array.isArray(chartConfig.measures.y) ? chartConfig.measures.y[0] : chartConfig.measures.y;
    // Some older charts stored aggregate as an object that looked like: { label: 'Mean', value: 'MEAN' }
    const aggregateValue = Utils.isObject(yMeasure.aggregate) ? yMeasure.aggregate.value : yMeasure.aggregate;
    const errorBarValue = yMeasure.errorBars;
    const includeNone = selectedType.name === 'line_plot';
    const includeCount = selectedType.name === 'bar_chart';
    const defaultAggregateValue = includeNone ? '' : 'SUM';
    const errorBarRadioEnabled = aggregateValue === 'MEAN';

    const aggregateOptions = useMemo(() => {
        const options = AGGREGATE_METHODS.filter(option => {
            if (option.value === 'COUNT' && !includeCount) return false;
            return !(option.value === '' && !includeNone);
        });

        return options.map(option => ({ ...option, selected: aggregateValue === option.value }));
    }, [aggregateValue, includeCount, includeNone]);

    const errorBarOptions = useMemo(() => {
        return ERROR_BAR_TYPES.map(option => ({
            ...option,
            disabled: !errorBarRadioEnabled,
            selected: errorBarValue === option.value,
        }));
    }, [errorBarRadioEnabled, errorBarValue]);

    const onChange = useCallback(
        (propName: string, value: string) => {
            setChartConfig(current => {
                const updatedConfig = {
                    ...current,
                    measures: {
                        ...current.measures,
                        [field.name]: { ...current.measures[field.name], [propName]: value },
                    },
                };

                if (selectedType.name === 'bar_chart') {
                    updatedConfig.labels = {
                        ...updatedConfig.labels,
                        y: getBarChartAxisLabel(updatedConfig, current),
                    };
                }

                return updatedConfig;
            });
        },
        [field.name, selectedType.name, setChartConfig]
    );

    const onAggregateChange = useCallback((_: never, value: string) => onChange('aggregate', value), [onChange]);
    const onErrorBarValueChange = useCallback((value: string) => onChange('errorBars', value), [onChange]);

    return (
        <>
            <div>
                <label>
                    Aggregate Method <LabelOverlay placement="right">{BAR_CHART_AGGREGATE_METHOD_TIP}</LabelOverlay>
                </label>
                <SelectInput
                    clearable={false}
                    inputClass="col-xs-12"
                    name="aggregate-method"
                    onChange={onAggregateChange}
                    options={aggregateOptions}
                    placeholder="Select aggregate method"
                    showLabel={false}
                    value={aggregateValue ?? defaultAggregateValue}
                />
            </div>
            <div className="field-option-radio-group field-option-radio-group-block">
                <label>
                    Error Bars <LabelOverlay placement="right">{BAR_CHART_ERROR_BAR_TIP}</LabelOverlay>
                </label>
                <RadioGroupInput
                    formsy={false}
                    name="error-bar-method"
                    onValueChange={onErrorBarValueChange}
                    options={errorBarOptions}
                />
            </div>
        </>
    );
});
ChartFieldAggregateOptions.displayName = 'ChartFieldAggregateOptions';
