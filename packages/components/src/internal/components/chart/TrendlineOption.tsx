import React, { ChangeEvent, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { LABKEY_VIS } from '../../constants';
import { LabelOverlay } from '../forms/LabelOverlay';

import { OverlayTrigger } from '../../OverlayTrigger';
import { Popover } from '../../Popover';
import { RadioGroupInput, RadioGroupOption } from '../forms/input/RadioGroupInput';

import { ChartFieldInfo, ChartTypeInfo, TrendlineType } from './models';
import { getFieldDataType, getSelectOptions } from './utils';
import { QueryModel } from '../../../public/QueryModel/QueryModel';

const ASYMPTOTE_TYPES = [
    { value: 'automatic', label: 'Automatic' },
    { value: 'manual', label: 'Manual' },
];

interface TrendlineOptionProps {
    fieldValues: Record<string, SelectInputOption>;
    model: QueryModel;
    onFieldChange: (key: string, value: SelectInputOption) => void;
    schemaQuery: SchemaQuery;
    selectedType: ChartTypeInfo;
}

export const TrendlineOption: FC<TrendlineOptionProps> = memo(props => {
    const TRENDLINE_OPTIONS: TrendlineType[] = Object.values(LABKEY_VIS.GenericChartHelper.TRENDLINE_OPTIONS);
    const { fieldValues, onFieldChange, schemaQuery, model, selectedType } = props;
    const showFieldOptions = fieldValues.trendlineType && fieldValues.trendlineType.value !== '';
    const showAsymptoteOptions = fieldValues.trendlineType?.showMin || fieldValues.trendlineType?.showMax;

    // hide the trendline option if no x-axis value selected and for date field selection on x-axis
    const hidden = useMemo(() => {
        const jsonType = getFieldDataType(fieldValues.x?.data);
        return !fieldValues.x?.value || jsonType === 'date' || jsonType === 'time';
    }, [fieldValues.x]);

    const options = useMemo(() => {
        const field = {
            name: 'parameters',
            textOnly: true,
            label: 'Provided Parameters',
            required: false,
        } as ChartFieldInfo;
        return getSelectOptions(model, selectedType, field);
    }, [model, selectedType]);
    // Issue 52050: use fieldKey for special characters
    const parameterInputValue = useMemo(() => {
        if (fieldValues?.trendlineParameters) {
            return fieldValues.trendlineParameters.data?.fieldKey ?? fieldValues.trendlineParameters.value;
        }
        return undefined;
    }, [fieldValues]);

    const onParameterFieldChange = useCallback(
        (name: string, _: string, selectedOption: SelectInputOption) => {
            onFieldChange(name, selectedOption);
        },
        [onFieldChange]
    );

    const [loadingTrendlineOptions, setLoadingTrendlineOptions] = useState<boolean>(true);
    const [asymptoteType, setAsymptoteType] = useState<string>('automatic');
    const [asymptoteMin, setAsymptoteMin] = useState<string>('');
    const [asymptoteMax, setAsymptoteMax] = useState<string>('');
    const invalidRange = useMemo(
        () => !!asymptoteMin && !!asymptoteMax && asymptoteMax <= asymptoteMin,
        [asymptoteMin, asymptoteMax]
    );
    useEffect(() => {
        if (loadingTrendlineOptions && (!!fieldValues.trendlineAsymptoteMin || !!fieldValues.trendlineAsymptoteMax)) {
            setAsymptoteType('manual');
            setAsymptoteMin(fieldValues.trendlineAsymptoteMin?.value);
            setAsymptoteMax(fieldValues.trendlineAsymptoteMax?.value);
            setLoadingTrendlineOptions(false);
        }
    }, [fieldValues, loadingTrendlineOptions]);

    const onTrendlineAsymptoteMin = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setAsymptoteMin(event.target.value);
    }, []);

    const onTrendlineAsymptoteMax = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setAsymptoteMax(event.target.value);
    }, []);

    const applyTrendlineAsymptote = useCallback(() => {
        if (invalidRange) return;
        onFieldChange('trendlineAsymptoteMin', { value: asymptoteMin });
        onFieldChange('trendlineAsymptoteMax', { value: asymptoteMax });
    }, [onFieldChange, asymptoteMin, asymptoteMax, invalidRange]);

    const clearTrendlineAsymptote = useCallback(() => {
        setAsymptoteMin('');
        onFieldChange('trendlineAsymptoteMin', undefined);
        setAsymptoteMax('');
        onFieldChange('trendlineAsymptoteMax', undefined);
    }, [onFieldChange]);

    const onTrendlineFieldChange = useCallback(
        (key: string, _, selectedOption: SelectInputOption) => {
            setAsymptoteType('automatic');
            clearTrendlineAsymptote();
            onFieldChange(key, selectedOption);
        },
        [clearTrendlineAsymptote, onFieldChange]
    );

    const trendlineOptions = useMemo(() => {
        return TRENDLINE_OPTIONS.filter(option => {
            return !option.schemaPrefix || schemaQuery.schemaName.startsWith(option.schemaPrefix);
        });
    }, [TRENDLINE_OPTIONS, schemaQuery.schemaName]);

    const onAsymptoteTypeChange = useCallback(
        (selected: string) => {
            if (selected === 'automatic') {
                clearTrendlineAsymptote();
            }
            setAsymptoteType(selected);
        },
        [clearTrendlineAsymptote]
    );

    const asymptoteTypeOptions = useMemo(() => {
        return ASYMPTOTE_TYPES.map(
            option =>
                ({
                    ...option,
                    selected: asymptoteType === option.value,
                }) as RadioGroupOption
        );
    }, [asymptoteType]);

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
                    value={fieldValues.trendlineType?.value ?? ''}
                />
                {showFieldOptions && (
                    <div className="field-option-icon">
                        <OverlayTrigger
                            overlay={
                                <Popover id="chart-field-option-popover" placement="left">
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
                                                    {fieldValues.trendlineType?.showMin && (
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
                                                    {fieldValues.trendlineType?.showMin &&
                                                        fieldValues.trendlineType?.showMax && <span> -</span>}
                                                    {fieldValues.trendlineType?.showMax && (
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
                                                    {invalidRange && (
                                                        <div className="text-danger">Invalid range (Max &lt;= Min)</div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <div className="top-padding">
                                        <label>
                                            Provided Parameters{' '}
                                            <LabelOverlay placement="bottom">
                                                Select the field in the data which has the already computed / saved
                                                curve fit parameters object for the selected Trendline type. These
                                                provided parameters will then be used in the trendline display instead
                                                of calculating new parameters based on the current data points in the
                                                grid.
                                            </LabelOverlay>
                                        </label>
                                        <SelectInput
                                            inputClass="col-xs-12"
                                            name="trendlineParameters"
                                            onChange={onParameterFieldChange}
                                            options={options}
                                            showLabel={false}
                                            value={parameterInputValue}
                                        />
                                    </div>
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
