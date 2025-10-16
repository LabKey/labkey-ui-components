import React, { FC, memo, useCallback, useMemo } from 'react';
import { OverlayTrigger } from '../../OverlayTrigger';
import { Popover } from '../../Popover';
import { RadioGroupInput, RadioGroupOption } from '../forms/input/RadioGroupInput';

import { BAR_CHART_AGGREGATE_NAME, BAR_CHART_ERROR_BAR_NAME } from './constants';
import { ChartFieldInfo } from './models';
import { LabelOverlay } from '../forms/LabelOverlay';
import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';

const BAR_CHART_AGGREGATE_METHODS = [
    { label: 'None', value: '' },
    { label: 'Count (non-blank)', value: 'COUNT' },
    { label: 'Sum', value: 'SUM' },
    { label: 'Min', value: 'MIN' },
    { label: 'Max', value: 'MAX' },
    { label: 'Mean', value: 'MEAN' },
    { label: 'Median', value: 'MEDIAN' },
];
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
    asOverlay?: boolean;
    field: ChartFieldInfo;
    fieldValues: Record<string, SelectInputOption>;
    includeCount: boolean;
    includeNone: boolean;
    onErrorBarChange: (name: string, value: string) => void;
    onSelectFieldChange: (name: string, value: string, selectedOption: SelectInputOption) => void;
}

export const ChartFieldAggregateOptions: FC<OwnProps> = memo(props => {
    const {
        field,
        fieldValues,
        onSelectFieldChange,
        onErrorBarChange,
        includeCount,
        includeNone,
        asOverlay = true,
    } = props;
    const fieldValue = fieldValues?.[field.name];
    const aggregateValue = fieldValues?.[BAR_CHART_AGGREGATE_NAME]?.value;
    const errorBarValue = fieldValues?.[BAR_CHART_ERROR_BAR_NAME]?.value;
    const defaultAggregateValue = useMemo(() => (includeNone ? '' : 'SUM'), [includeNone]);
    const errorBarRadioEnabled = useMemo(() => aggregateValue === 'MEAN', [aggregateValue]);

    const aggregateOptions = useMemo(() => {
        const options = BAR_CHART_AGGREGATE_METHODS.filter(option => {
            if (option.value === 'COUNT' && !includeCount) {
                return false;
            }
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

    const onAggregateChange = useCallback(
        (name: string, value: string, selectedOption: SelectInputOption) => {
            onSelectFieldChange(name, value, selectedOption);
        },
        [onSelectFieldChange]
    );

    const onErrorBarValueChange = useCallback(
        (value: string) => {
            onErrorBarChange(BAR_CHART_ERROR_BAR_NAME, value);
        },
        [onErrorBarChange]
    );

    // Only show the aggregate options if there is a field selected
    if (!fieldValue?.value) {
        return null;
    }

    const inputs = (
        <>
            <div>
                <label>
                    Aggregate Method <LabelOverlay placement="bottom">{BAR_CHART_AGGREGATE_METHOD_TIP}</LabelOverlay>
                </label>
                <SelectInput
                    clearable={false}
                    inputClass="col-xs-12"
                    name={BAR_CHART_AGGREGATE_NAME}
                    onChange={onAggregateChange}
                    options={aggregateOptions}
                    placeholder="Select aggregate method"
                    showLabel={false}
                    value={aggregateValue ?? defaultAggregateValue}
                />
            </div>
            <div className="field-option-radio-group field-option-radio-group-block">
                <label>
                    Error Bars <LabelOverlay placement="bottom">{BAR_CHART_ERROR_BAR_TIP}</LabelOverlay>
                </label>
                <RadioGroupInput
                    formsy={false}
                    name={BAR_CHART_ERROR_BAR_NAME}
                    onValueChange={onErrorBarValueChange}
                    options={errorBarOptions}
                />
            </div>
        </>
    );

    if (!asOverlay) {
        return inputs;
    }

    return (
        <div className="field-option-icon">
            <OverlayTrigger
                overlay={
                    <Popover id="chart-field-option-popover" placement="left">
                        {inputs}
                    </Popover>
                }
                triggerType="click"
            >
                <span className="fa fa-gear" />
            </OverlayTrigger>
        </div>
    );
});
ChartFieldAggregateOptions.displayName = 'ChartFieldAggregateOptions';
