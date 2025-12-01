import React, { ChangeEvent, FC, memo, useCallback, useMemo, useState } from 'react';
import { OverlayTrigger } from '../../OverlayTrigger';
import { Popover } from '../../Popover';
import { ChartConfig, ChartConfigSetter, ChartFieldInfo, ChartTypeInfo, ScaleType } from './models';
import { getFieldDataType, shouldShowAggregateOptions, shouldShowRangeScaleOptions } from './utils';
import { LABKEY_VIS } from '../../constants';
import { ChartFieldAggregateOptions } from './ChartFieldAggregateOptions';
import { ChartFieldRangeScaleOptions } from './ChartFieldRangeScaleOptions';
import { useEnterEscape } from '../../../public/useEnterEscape';

interface FieldLabelInputProps {
    label: string;
    name: string;
    setChartConfig: ChartConfigSetter;
    value: string;
}

const FieldLabelInput: FC<FieldLabelInputProps> = memo(({ label, name, setChartConfig, value }) => {
    const [inputValue, setInputValue] = useState<string>(value ?? '');
    const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value), []);
    const onBlur = useCallback(() => {
        setChartConfig(current => ({ ...current, labels: { ...current.labels, [name]: inputValue.trim() } }));
    }, [inputValue, name, setChartConfig]);
    const onKeyDown = useEnterEscape(onBlur);

    return (
        <div className="form-group">
            <label>{label} Label</label>
            <input
                className="form-control"
                name={name as string}
                onBlur={onBlur}
                onChange={onChange}
                onKeyDown={onKeyDown}
                type="text"
                value={inputValue}
            />
        </div>
    );
});
FieldLabelInput.displayName = 'FieldLabelInput';

interface Props {
    chartConfig: ChartConfig;
    field: ChartFieldInfo;
    onScaleChange: (scale: Partial<ScaleType>, localOnly?: boolean) => void;
    scale: ScaleType;
    selectedType: ChartTypeInfo;
    setChartConfig: ChartConfigSetter;
}

export const ChartFieldAdditionalOptions: FC<Props> = memo(props => {
    const { chartConfig, field, onScaleChange, scale, selectedType, setChartConfig } = props;
    const { measures } = chartConfig;
    const measure = measures?.[field.name];
    const isNumericType = useMemo(
        () => LABKEY_VIS.GenericChartHelper.isNumericType(getFieldDataType(measure)),
        [measure]
    );
    const showRangeScaleOptions = isNumericType && shouldShowRangeScaleOptions(field, selectedType);
    const showAggregateOptions = isNumericType && shouldShowAggregateOptions(field, selectedType);
    const overlay = (
        <Popover className="chart-field-additional-options" id="chart-field-option-popover" placement="right">
            <FieldLabelInput
                label={field.label}
                name={field.name}
                setChartConfig={setChartConfig}
                value={chartConfig.labels[field.name]}
            />
            {showAggregateOptions && (
                <ChartFieldAggregateOptions
                    chartConfig={chartConfig}
                    field={field}
                    selectedType={selectedType}
                    setChartConfig={setChartConfig}
                />
            )}
            {showRangeScaleOptions && (
                <ChartFieldRangeScaleOptions
                    onScaleChange={onScaleChange}
                    scale={scale}
                    showScaleTrans={selectedType.name !== 'bar_chart'}
                />
            )}
        </Popover>
    );
    return (
        <div className="field-option-icon">
            <OverlayTrigger overlay={overlay} triggerType="click">
                <span className="fa fa-gear" />
            </OverlayTrigger>
        </div>
    );
});
ChartFieldAdditionalOptions.displayName = 'ChartFieldAdditionalOptions';
