import React, { ChangeEvent, FC, memo, useCallback, useMemo } from 'react';
import { BaseChartModel, BaseChartModelSetter, ChartConfig, ChartConfigSetter, ChartTypeInfo } from './models';
import { LABKEY_VIS } from '../../constants';
import { HIDDEN_CHART_TYPES, ICONS } from './constants';
import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';
import { SVGIcon } from '../base/SVGIcon';
import { CheckboxLK } from '../../Checkbox';
import { ChartFieldOption } from './ChartFieldOption';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { TrendlineOption } from './TrendlineOption';
import { deepCopyChartConfig, hasTrendline } from './utils';

type LabelKey = keyof ChartConfig['labels'];

interface LabelInputProps {
    label: string;
    name: LabelKey;
    onChange: (name: LabelKey, value: string) => void;
    value: string;
}

const LabelInput: FC<LabelInputProps> = memo(({ label, name, onChange, value }) => {
    const onChange_ = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => onChange(name, event.target.value),
        [name, onChange]
    );
    return (
        <div>
            <label>{label}</label>
            <input className="form-control" name={name as string} onChange={onChange_} type="text" value={value} />
        </div>
    );
});
LabelInput.displayName = 'LabelInput';

interface BoolSettingInputProps {
    label: string;
    name: string;
    onChange: (name: LabelKey, value: boolean) => void;
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

// TODO: use the same icons as the ChartMenu
//  - Not the most straightforward because those icons are set server-side
function chartTypeOptionRenderer(option: SelectInputOption) {
    const data = option.data.data;
    return (
        <div className="chart-builder-type-option">
            <SVGIcon height={null} iconSrc={ICONS[data.name] + '_gray'} width={32} />
            <span>{data.title}</span>
        </div>
    );
}

interface ChartTypeDropdownProps {
    onChange: (chartTypeInfo: ChartTypeInfo) => void;
    selectedType: ChartTypeInfo;
}

const ChartTypeDropdown: FC<ChartTypeDropdownProps> = memo(({ onChange, selectedType }) => {
    const chartTypes = useMemo(() => {
        const allTypes = LABKEY_VIS?.GenericChartHelper.getRenderTypes();
        return allTypes
            .filter(type => !type.hidden && !HIDDEN_CHART_TYPES.includes(type.name))
            .map(type => ({
                data: type,
                label: type.title,
                value: type.name,
            }));
    }, []);
    const onChange_ = useCallback(
        (_, __, opt) => {
            onChange(opt.data);
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
                    name="chartType"
                    onChange={onChange_}
                    optionRenderer={chartTypeOptionRenderer}
                    options={chartTypes}
                    value={selectedType.name}
                    // TODO: using chartTypeOptionRenderer as valueRenderer makes the dropdown too tall
                    // valueRenderer={chartTypeOptionRenderer}
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
    model: QueryModel;
    setChartConfig: ChartConfigSetter;
    setChartModel: BaseChartModelSetter;
}

export const ChartSettingsPanel: FC<Props> = memo(props => {
    const { allowInherit, canShare, chartConfig, chartType, chartModel, model, setChartConfig, setChartModel } = props;
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
            setChartConfig(current => ({
                ...deepCopyChartConfig(undefined),
                labels: { ...current.labels },
                renderType: type.name,
            }));
        },
        [setChartConfig]
    );

    const onLabelChange = useCallback(
        (key: LabelKey, value: string) => {
            setChartConfig(current => ({ ...current, labels: { ...current.labels, [key]: value } }));
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

            {!chartModel && <ChartTypeDropdown onChange={onTypeChange} selectedType={chartType} />}

            {fields.map(field => (
                <ChartFieldOption
                    chartConfig={chartConfig}
                    field={field}
                    key={field.name}
                    model={model}
                    selectedType={chartType}
                    setChartConfig={setChartConfig}
                />
            ))}

            {showTrendline && (
                <TrendlineOption
                    chartConfig={chartConfig}
                    schemaQuery={model.schemaQuery}
                    setChartConfig={setChartConfig}
                />
            )}

            <h4>Customize</h4>
            <LabelInput label="Title" name="main" onChange={onLabelChange} value={chartConfig?.labels?.main} />
            <LabelInput
                label="Subtitle"
                name="subtitle"
                onChange={onLabelChange}
                value={chartConfig?.labels?.subtitle}
            />
            {/*  TODO: width/height  */}
        </div>
    );
});
ChartSettingsPanel.displayName = 'ChartSettingsPanel';
