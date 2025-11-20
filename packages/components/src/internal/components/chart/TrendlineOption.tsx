import React, { ChangeEvent, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { SelectInput } from '../forms/input/SelectInput';

import { LABKEY_VIS } from '../../constants';
import { LabelOverlay } from '../forms/LabelOverlay';

import { OverlayTrigger } from '../../OverlayTrigger';
import { Popover } from '../../Popover';
import { RadioGroupInput, RadioGroupOption } from '../forms/input/RadioGroupInput';

import { ChartConfig, ChartConfigSetter, ChartFieldInfo, ChartTypeInfo, TrendlineType } from './models';
import { getFieldDataType, getSelectOptions } from './utils';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { QueryColumn } from '../../../public/QueryColumn';

const ASYMPTOTE_TYPES = [
    { value: 'automatic', label: 'Automatic' },
    { value: 'manual', label: 'Manual' },
];

interface TrendlineOptionProps {
    chartConfig: ChartConfig;
    model: QueryModel;
    selectedType: ChartTypeInfo;
    setChartConfig: ChartConfigSetter;
}

export const TrendlineOption: FC<TrendlineOptionProps> = memo(props => {
    const TRENDLINE_OPTIONS: TrendlineType[] = Object.values(LABKEY_VIS.GenericChartHelper.TRENDLINE_OPTIONS);
    const { chartConfig, model, selectedType, setChartConfig } = props;
    const schemaQuery = model.schemaQuery;
    const geomOptions = chartConfig?.geomOptions;
    const measures = chartConfig?.measures;
    const selectedTrendlineType = useMemo(() => {
        return TRENDLINE_OPTIONS.find(option => option.value === geomOptions?.trendlineType);
    }, [TRENDLINE_OPTIONS, geomOptions?.trendlineType]);
    const showFieldOptions = selectedTrendlineType?.showMin || selectedTrendlineType?.showMax;

    // hide the trendline option if no x-axis value selected and for date field selection on x-axis
    const hidden = useMemo(() => {
        const jsonType = getFieldDataType(measures?.x);
        return !measures?.x || jsonType === 'date' || jsonType === 'time';
    }, [measures?.x]);

    const [loadingTrendlineOptions, setLoadingTrendlineOptions] = useState<boolean>(true);
    const [asymptoteType, setAsymptoteType] = useState<string>('automatic');
    const [asymptoteMin, setAsymptoteMin] = useState<string>('');
    const [asymptoteMax, setAsymptoteMax] = useState<string>('');
    const invalidRange = useMemo(
        () => !!asymptoteMin && !!asymptoteMax && asymptoteMax <= asymptoteMin,
        [asymptoteMin, asymptoteMax]
    );

    useEffect(() => {
        if (loadingTrendlineOptions && (!!geomOptions?.trendlineAsymptoteMin || !!geomOptions?.trendlineAsymptoteMax)) {
            setAsymptoteType('manual');
            setAsymptoteMin(geomOptions?.trendlineAsymptoteMin?.toString());
            setAsymptoteMax(geomOptions?.trendlineAsymptoteMax?.toString());
            setLoadingTrendlineOptions(false);
        }
    }, [geomOptions, loadingTrendlineOptions]);

    const onTrendlineAsymptoteMin = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setAsymptoteMin(event.target.value);
    }, []);

    const onTrendlineAsymptoteMax = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setAsymptoteMax(event.target.value);
    }, []);

    const setGeomOptions = useCallback(
        options => {
            setChartConfig(current => ({
                ...current,
                geomOptions: { ...current.geomOptions, ...options },
            }));
        },
        [setChartConfig]
    );

    const applyTrendlineAsymptote = useCallback(() => {
        if (invalidRange) return;
        setGeomOptions({ trendlineAsymptoteMin: asymptoteMin, trendlineAsymptoteMax: asymptoteMax });
    }, [asymptoteMin, asymptoteMax, invalidRange, setGeomOptions]);

    const clearTrendlineAsymptote = useCallback(
        (updateChartConfig: boolean) => {
            setAsymptoteMin('');
            setAsymptoteMax('');
            if (updateChartConfig) {
                setGeomOptions({ trendlineAsymptoteMin: undefined, trendlineAsymptoteMax: undefined });
            }
        },
        [setGeomOptions]
    );

    const onTrendlineFieldChange = useCallback(
        (_: never, value: string) => {
            setAsymptoteType('automatic');
            clearTrendlineAsymptote(false);
            setGeomOptions({
                trendlineType: value,
                trendlineAsymptoteMin: undefined,
                trendlineAsymptoteMax: undefined,
            });
        },
        [clearTrendlineAsymptote, setGeomOptions]
    );

    const trendlineOptions = useMemo(() => {
        return TRENDLINE_OPTIONS.filter(option => {
            return !option.schemaPrefix || schemaQuery.schemaName.startsWith(option.schemaPrefix);
        });
    }, [TRENDLINE_OPTIONS, schemaQuery.schemaName]);

    const onAsymptoteTypeChange = useCallback(
        (selected: string) => {
            if (selected === 'automatic') {
                clearTrendlineAsymptote(true);
            }
            setAsymptoteType(selected);
        },
        [clearTrendlineAsymptote]
    );

    if (hidden) return null;

    return (
        <div className="trendline-option">
            <label>
                Trendline{' '}
                <LabelOverlay placement="bottom">
                    {trendlineOptions
                        .filter(option => option.equation)
                        .map(option => (
                            <div className="row margin-bottom" key={option.value}>
                                <div className="col-xs-4">
                                    <strong>{option.label}</strong>
                                </div>
                                <div className="col-xs-8 equation">{option.equation}</div>
                            </div>
                        ))}
                </LabelOverlay>
            </label>
            <div className="form-group row">
                <SelectInput
                    clearable={false}
                    containerClass=""
                    inputClass={showFieldOptions ? 'col-xs-11' : 'col-xs-12'}
                    name="trendlineType"
                    onChange={onTrendlineFieldChange}
                    options={trendlineOptions}
                    placeholder="Select trendline option"
                    showLabel={false}
                    value={selectedTrendlineType?.value ?? ''}
                />
                {showFieldOptions && (
                    <div className="field-option-icon">
                        <OverlayTrigger
                            overlay={
                                <Popover id="chart-field-option-popover" placement="left">
                                    <TrendlineOptionPopover
                                        applyTrendlineAsymptote={applyTrendlineAsymptote}
                                        asymptoteMax={asymptoteMax}
                                        asymptoteMin={asymptoteMin}
                                        asymptoteType={asymptoteType}
                                        chartConfig={chartConfig}
                                        model={model}
                                        onAsymptoteTypeChange={onAsymptoteTypeChange}
                                        onTrendlineAsymptoteMax={onTrendlineAsymptoteMax}
                                        onTrendlineAsymptoteMin={onTrendlineAsymptoteMin}
                                        selectedType={selectedType}
                                        setGeomOptions={setGeomOptions}
                                    />
                                </Popover>
                            }
                            triggerType="click"
                        >
                            <span className="fa fa-gear" />
                        </OverlayTrigger>
                    </div>
                )}
            </div>
        </div>
    );
});
TrendlineOption.displayName = 'TrendlineOption';

interface TrendlineOptionPopoverProps {
    applyTrendlineAsymptote: () => void;
    asymptoteMax: string;
    asymptoteMin: string;
    asymptoteType: string;
    chartConfig: ChartConfig;
    model: QueryModel;
    onAsymptoteTypeChange: (selected: string) => void;
    onTrendlineAsymptoteMax: (event: ChangeEvent<HTMLInputElement>) => void;
    onTrendlineAsymptoteMin: (event: ChangeEvent<HTMLInputElement>) => void;
    selectedType: ChartTypeInfo;
    setGeomOptions: (options: Record<string, string>) => void;
}

const TrendlineOptionPopover: FC<TrendlineOptionPopoverProps> = props => {
    const {
        applyTrendlineAsymptote,
        model,
        selectedType,
        asymptoteType,
        chartConfig,
        onAsymptoteTypeChange,
        asymptoteMin,
        asymptoteMax,
        onTrendlineAsymptoteMin,
        onTrendlineAsymptoteMax,
        setGeomOptions,
    } = props;
    const geomOptions = chartConfig.geomOptions;
    const TRENDLINE_OPTIONS: TrendlineType[] = Object.values(LABKEY_VIS.GenericChartHelper.TRENDLINE_OPTIONS);
    const selectedTrendlineType = useMemo(() => {
        return TRENDLINE_OPTIONS.find(option => option.value === geomOptions?.trendlineType);
    }, [TRENDLINE_OPTIONS, geomOptions?.trendlineType]);
    const showAsymptoteOptions = selectedTrendlineType?.showMin || selectedTrendlineType?.showMax;
    const invalidRange = useMemo(
        () => !!asymptoteMin && !!asymptoteMax && asymptoteMax <= asymptoteMin,
        [asymptoteMin, asymptoteMax]
    );

    const options = useMemo(() => {
        const field = {
            name: 'parameters',
            textOnly: true,
            label: 'Provided Parameters',
            required: false,
        } as ChartFieldInfo;
        return getSelectOptions(model, selectedType, field);
    }, [model, selectedType]);

    const asymptoteTypeOptions = useMemo(() => {
        return ASYMPTOTE_TYPES.map(
            option => ({ ...option, selected: asymptoteType === option.value }) as RadioGroupOption
        );
    }, [asymptoteType]);

    // chartConfig.geomOptions.trendlineParameters,
    const onParameterFieldChange = useCallback(
        (_: never, __: never, col: QueryColumn) => {
            setGeomOptions({ trendlineParameters: col.fieldKey });
        },
        [setGeomOptions]
    );

    return (
        <div>
            {showAsymptoteOptions && (
                <>
                    <div className="field-option-radio-group">
                        <label>Asymptote</label>
                        <RadioGroupInput
                            formsy={false}
                            name="asymptoteType"
                            onValueChange={onAsymptoteTypeChange}
                            options={asymptoteTypeOptions}
                        />
                    </div>
                    {asymptoteType === 'manual' && (
                        <div className="chart-builder-asymptote-inputs">
                            {selectedTrendlineType?.showMin && (
                                <input
                                    className="chart-builder-field-footer-input"
                                    name="trendlineAsymptoteMin"
                                    onBlur={applyTrendlineAsymptote}
                                    onChange={onTrendlineAsymptoteMin}
                                    placeholder="Min"
                                    type="number"
                                    value={asymptoteMin}
                                />
                            )}
                            {selectedTrendlineType?.showMin && selectedTrendlineType?.showMax && <span> -</span>}
                            {selectedTrendlineType?.showMax && (
                                <input
                                    className="chart-builder-field-footer-input"
                                    name="trendlineAsymptoteMax"
                                    onBlur={applyTrendlineAsymptote}
                                    onChange={onTrendlineAsymptoteMax}
                                    placeholder="Max"
                                    type="number"
                                    value={asymptoteMax}
                                />
                            )}
                            {invalidRange && <div className="text-danger">Invalid range (Max &lt;= Min)</div>}
                        </div>
                    )}
                </>
            )}
            <div className="margin-top">
                <label>
                    Provided Parameters{' '}
                    <LabelOverlay placement="bottom">
                        Select the field in the data which has the already computed / saved curve fit parameters object
                        for the selected Trendline type. These provided parameters will then be used in the trendline
                        display instead of calculating new parameters based on the current data points in the grid.
                    </LabelOverlay>
                </label>
                <SelectInput
                    inputClass="col-xs-12"
                    labelKey="caption"
                    name="trendlineParameters"
                    onChange={onParameterFieldChange}
                    options={options}
                    showLabel={false}
                    value={chartConfig.geomOptions.trendlineParameters}
                    valueKey="fieldKey"
                />
            </div>
        </div>
    );
};
