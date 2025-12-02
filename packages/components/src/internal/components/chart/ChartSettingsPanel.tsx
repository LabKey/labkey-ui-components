import React, { ChangeEvent, FC, memo, useCallback, useMemo, useState } from 'react';
import {
    BaseChartModel,
    BaseChartModelSetter,
    ChartConfig,
    ChartConfigSetter,
    ChartLabels,
    ChartTypeInfo,
} from './models';
import { LABKEY_VIS } from '../../constants';
import { HIDDEN_CHART_TYPES, ICONS } from './constants';
import { SelectInput } from '../forms/input/SelectInput';
import { SVGIcon } from '../base/SVGIcon';
import { CheckboxLK } from '../../Checkbox';
import { ChartFieldOption } from './ChartFieldOption';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { TrendlineOption } from './TrendlineOption';
import { deepCopyChartConfig, hasTrendline } from './utils';
import classNames from 'classnames';
import { useEnterEscape } from '../../../public/useEnterEscape';
import { ChartLabelInput } from './ChartLabelInput';

function changedIntValue(strVal: string, currentVal: number): [value: number, changed: boolean] {
    strVal = strVal.trim();
    const value = strVal === '' ? undefined : parseInt(strVal, 10);
    // If the number is NaN then we don't want to trigger change
    const changed = (value === undefined || !isNaN(value)) && value !== currentVal;

    return [value, changed];
}

function computeMarginTop(main: string, subtitle: string): number {
    let marginTop = 15;
    const hasTitle = !!main?.trim();
    const hasSubtitle = !!subtitle?.trim();

    if (hasTitle && hasSubtitle) marginTop += 50;
    else if (hasTitle) marginTop += 25;
    // Yes, really, subtitle only gets the most padding. Our charting library is probably setting some
    // default amount if main is present
    else if (hasSubtitle) marginTop += 55;

    return marginTop;
}

interface InputProps {
    label: string;
    name: string;
    value: string;
}

interface BoolSettingInputProps extends Omit<InputProps, 'value'> {
    onChange: (name: string, value: boolean) => void;
    value: boolean;
}

const BoolSettingInput: FC<BoolSettingInputProps> = memo(({ label, name, onChange, value }) => {
    const onChange_ = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            onChange(name, event.target.checked);
        },
        [name, onChange]
    );
    return (
        <CheckboxLK checked={value} name={name} onChange={onChange_}>
            {label}
        </CheckboxLK>
    );
});
BoolSettingInput.displayName = 'BoolSettingInput';

interface NumberInputProps extends Omit<InputProps, 'value'> {
    disabled: boolean;
    name: 'height' | 'width';
    onBlur: () => void;
    onChange: (name: 'height' | 'width', value: string) => void;
    value: string;
}

const NumberInput: FC<NumberInputProps> = memo(({ disabled, label, name, onBlur, onChange, value }) => {
    const onInputChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => onChange(name, event.target.value),
        [name, onChange]
    );
    const onKeyDown = useEnterEscape(onBlur);

    return (
        <div>
            <label>{label}</label>
            <input
                className="form-control is-invalid"
                disabled={disabled}
                name={name}
                onBlur={onBlur}
                onChange={onInputChange}
                onKeyDown={onKeyDown}
                type="text"
                value={value}
            />
        </div>
    );
});
NumberInput.displayName = 'NumberInput';

interface SizeInputsProps {
    height: number;
    setChartConfig: ChartConfigSetter;
    width: number;
}
const SizeInputs: FC<SizeInputsProps> = memo(({ height, setChartConfig, width }) => {
    // We store sizes in a separate useState so the user can edit the  values without us rerendering on every keystroke,
    // and so we can easily handle invalid values.
    const [sizes, setSizes] = useState<Record<string, string>>(() => ({
        height: height?.toString() ?? '',
        width: width?.toString() ?? '',
    }));
    const [useFullWidth, setUseFullWidth] = useState(width === undefined);
    const onCheckboxChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const checked = e.target.checked;

            if (checked) {
                setChartConfig(current => ({ ...current, width: undefined }));
                setSizes(current => ({ ...current, width: '' }));
            }

            setUseFullWidth(checked);
        },
        [setChartConfig]
    );
    const onNumberChange = useCallback((name, value) => setSizes(current => ({ ...current, [name]: value })), []);
    const onBlur = useCallback(() => {
        setChartConfig(current => {
            const [height, heightChanged] = changedIntValue(sizes.height, current.height);
            const [width, widthChanged] = changedIntValue(sizes.width, current.width);

            if (!heightChanged && !widthChanged) return current;

            return {
                ...current,
                height: heightChanged ? height : current.height,
                width: widthChanged ? width : current.width,
            };
        });
    }, [setChartConfig, sizes]);

    return (
        <>
            {/* intentionally not setting form-group class on the div below */}
            <div className="row">
                <div className="col-xs-6">
                    <NumberInput
                        disabled={useFullWidth}
                        label="Width (px)"
                        name="width"
                        onBlur={onBlur}
                        onChange={onNumberChange}
                        value={sizes.width}
                    />
                </div>
                <div className="col-xs-6">
                    <NumberInput
                        disabled={false}
                        label="Height (px)"
                        name="height"
                        onBlur={onBlur}
                        onChange={onNumberChange}
                        value={sizes.height}
                    />
                </div>
            </div>
            <div className="form-group row">
                <div className="col-xs-12">
                    <CheckboxLK checked={useFullWidth} name="use-full-width" onChange={onCheckboxChange}>
                        Full Width
                    </CheckboxLK>
                </div>
            </div>
        </>
    );
});
SizeInputs.displayName = 'SizeInputs';

interface ChartTypeOptionRendererProps {
    chartType: ChartTypeInfo;
    isValueRenderer: boolean;
}
const ChartTypeOptionRenderer: FC<ChartTypeOptionRendererProps> = memo(({ chartType, isValueRenderer }) => {
    const icon = ICONS[chartType.name];
    const isSvg = icon.endsWith('.svg');
    const className = classNames('chart-builder-type-option', { 'chart-builder-type-option--value': isValueRenderer });
    return (
        <span className={className} data-chart-type={chartType.name}>
            {isSvg && (
                <SVGIcon height={null} iconDir="visualization/report" iconSrc={icon.replace('.svg', '')} width={16} />
            )}
            {!isSvg && <span className={`fa ${icon}`} />}
            <span>{chartType.title}</span>
        </span>
    );
});
ChartTypeOptionRenderer.displayName = 'ChartTypeOptionRenderer';

function chartTypeOptionRenderer(option) {
    const chartType: ChartTypeInfo = option.data as ChartTypeInfo;
    return <ChartTypeOptionRenderer chartType={chartType} isValueRenderer={false} />;
}

function chartTypeValueRenderer(option) {
    const chartType: ChartTypeInfo = option.data as ChartTypeInfo;
    return <ChartTypeOptionRenderer chartType={chartType} isValueRenderer />;
}

interface ChartTypeDropdownProps {
    onChange: (chartTypeInfo: ChartTypeInfo) => void;
    selectedType: ChartTypeInfo;
}

const ChartTypeDropdown: FC<ChartTypeDropdownProps> = memo(({ onChange, selectedType }) => {
    const chartTypes = useMemo(() => {
        const allTypes = LABKEY_VIS?.GenericChartHelper.getRenderTypes();
        return allTypes.filter(type => !type.hidden && !HIDDEN_CHART_TYPES.includes(type.name));
    }, []);
    const onChange_ = useCallback(
        (_, __, opt) => {
            onChange(opt);
        },
        [onChange]
    );

    return (
        <div>
            <label>Chart Type</label>
            <div className="form-group row">
                <SelectInput
                    clearable={false}
                    containerClass=""
                    inputClass="col-xs-12"
                    labelKey="title"
                    name="chartType"
                    onChange={onChange_}
                    optionRenderer={chartTypeOptionRenderer}
                    options={chartTypes}
                    value={selectedType.name}
                    valueKey="name"
                    valueRenderer={chartTypeValueRenderer}
                />
            </div>
        </div>
    );
});
ChartTypeDropdown.displayName = 'ChartTypeDropdown';

interface Props {
    allowInherit: boolean;
    canShare: boolean;
    chartConfig: ChartConfig;
    chartModel: BaseChartModel;
    chartType: ChartTypeInfo;
    isNew: boolean;
    model: QueryModel;
    setChartConfig: ChartConfigSetter;
    setChartModel: BaseChartModelSetter;
}

export const ChartSettingsPanel: FC<Props> = memo(props => {
    const { allowInherit, canShare, chartConfig, chartType, chartModel, isNew, model, setChartConfig, setChartModel } =
        props;
    const showTrendline = hasTrendline(chartType);
    const fields = chartType.fields.filter(f => f.name !== 'trendline');

    const onChartModelChange = useCallback(
        (key: keyof BaseChartModel, value: boolean | string) => {
            setChartModel(current => ({ ...current, [key]: value }));
        },
        [setChartModel]
    );

    const onNameChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            onChartModelChange('name', event.target.value);
        },
        [onChartModelChange]
    );

    const onTypeChange = useCallback(
        (type: ChartTypeInfo) => {
            setChartConfig(current => {
                const { main, subtitle } = current.labels;
                const newConfig = deepCopyChartConfig(undefined, type.name);
                return {
                    ...newConfig,
                    labels: { main, subtitle },
                    // Keep marginTop to account for main / subtitle labels
                    geomOptions: { ...newConfig.geomOptions, marginTop: computeMarginTop(main, subtitle) },
                };
            });
        },
        [setChartConfig]
    );

    const onLabelChange = useCallback(
        (key: keyof ChartLabels, value: string) => {
            setChartConfig(current => {
                const labels = { ...current.labels, [key]: value };
                let geomOptions = current.geomOptions;
                const marginTop = computeMarginTop(labels.main, labels.subtitle);
                if (marginTop != geomOptions.marginTop) geomOptions = { ...geomOptions, marginTop };

                return { ...current, labels, geomOptions };
            });
        },
        [setChartConfig]
    );

    return (
        <div className="chart-builder-modal__settings-panel">
            <h4>Settings</h4>
            <div>
                <label>Name *</label>
                <input
                    className="form-control"
                    name="name"
                    onChange={onNameChange}
                    placeholder="Enter a name"
                    type="text"
                    value={chartModel.name}
                />
            </div>

            {canShare && (
                <BoolSettingInput
                    label="Make this chart available to all users"
                    name="shared"
                    onChange={onChartModelChange}
                    value={chartModel?.shared ?? false}
                />
            )}

            {allowInherit && (
                <BoolSettingInput
                    label="Make this chart available in child folder"
                    name="inheritable"
                    onChange={onChartModelChange}
                    value={chartModel?.inheritable ?? false}
                />
            )}

            {!isNew && <ChartTypeDropdown onChange={onTypeChange} selectedType={chartType} />}

            {fields.map(field => (
                <ChartFieldOption
                    chartConfig={chartConfig}
                    field={field}
                    key={field.name}
                    model={model}
                    onLabelChange={onLabelChange}
                    selectedType={chartType}
                    setChartConfig={setChartConfig}
                />
            ))}

            {showTrendline && (
                <TrendlineOption
                    chartConfig={chartConfig}
                    model={model}
                    selectedType={chartType}
                    setChartConfig={setChartConfig}
                />
            )}

            <h4>Customize</h4>
            <ChartLabelInput label="Title" name="main" onChange={onLabelChange} value={chartConfig?.labels?.main} />
            <ChartLabelInput
                label="Subtitle"
                name="subtitle"
                onChange={onLabelChange}
                value={chartConfig?.labels?.subtitle}
            />
            <SizeInputs height={chartConfig.height} setChartConfig={setChartConfig} width={chartConfig.width} />
        </div>
    );
});
ChartSettingsPanel.displayName = 'ChartSettingsPanel';
