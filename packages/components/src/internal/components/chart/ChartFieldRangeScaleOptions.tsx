import React, { ChangeEvent, FC, memo, PropsWithChildren, useCallback, useMemo } from 'react';
import { OverlayTrigger } from '../../OverlayTrigger';
import { Popover } from '../../Popover';
import { RadioGroupInput, RadioGroupOption } from '../forms/input/RadioGroupInput';

import { ChartFieldInfo, ScaleType } from './models';

const SCALE_TRANS_TYPES = [
    { value: 'linear', label: 'Linear' },
    { value: 'log', label: 'Log' },
];

const SCALE_RANGE_TYPES = [
    { value: 'automatic', label: 'Automatic' },
    { value: 'manual', label: 'Manual' },
];

interface OwnProps extends PropsWithChildren {
    field: ChartFieldInfo;
    onScaleChange: (field: string, key: string, value: number | string, reset?: boolean) => void;
    scale: ScaleType;
    setScale: (scale: ScaleType) => void;
}

export const ChartFieldRangeScaleOptions: FC<OwnProps> = memo(props => {
    const { field, scale, setScale, onScaleChange, children } = props;

    const scaleTransOptions = useMemo(() => {
        return SCALE_TRANS_TYPES.map(
            option =>
                ({
                    ...option,
                    selected: scale.trans === option.value,
                }) as RadioGroupOption
        );
    }, [scale.trans]);

    const scaleTypeOptions = useMemo(() => {
        return SCALE_RANGE_TYPES.map(
            option =>
                ({
                    ...option,
                    selected: scale.type === option.value,
                }) as RadioGroupOption
        );
    }, [scale.type]);

    const invalidRange = useMemo(
        () =>
            scale.min !== undefined &&
            scale.min !== null &&
            scale.max !== undefined &&
            scale.max !== null &&
            parseFloat(scale.max.toString()) <= parseFloat(scale.min.toString()),
        [scale]
    );

    const onScaleTransChange = useCallback(
        (selected: string) => {
            onScaleChange(field.name, 'trans', selected);
            setScale({ ...scale, trans: selected });
        },
        [field.name, onScaleChange, setScale, scale]
    );

    const onScaleTypeChange = useCallback(
        (selected: string) => {
            let scale_ = { ...scale, type: selected };
            onScaleChange(field.name, 'type', selected);
            if (selected === 'automatic') {
                onScaleChange(field.name, 'min', undefined);
                onScaleChange(field.name, 'max', undefined);
                scale_ = { ...scale_, min: undefined, max: undefined };
            }
            setScale(scale_);
        },
        [field.name, onScaleChange, scale, setScale]
    );

    const onScaleMinChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setScale({ ...scale, min: event.target.value });
        },
        [setScale, scale]
    );

    const onScaleMaxChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setScale({ ...scale, max: event.target.value });
        },
        [setScale, scale]
    );

    const onScaleRangeBlur = useCallback(() => {
        if (invalidRange) return;
        onScaleChange(field.name, 'min', parseFloat(scale.min?.toString()));
        onScaleChange(field.name, 'max', parseFloat(scale.max?.toString()));
    }, [field.name, onScaleChange, scale.max, scale.min, invalidRange]);

    return (
        <div className="field-option-icon">
            <OverlayTrigger
                overlay={
                    <Popover id="chart-field-option-popover" placement="bottom">
                        {children}
                        <div className="field-option-radio-group">
                            <label>Scale</label>
                            <RadioGroupInput
                                formsy={false}
                                name="scaleTrans"
                                onValueChange={onScaleTransChange}
                                options={scaleTransOptions}
                            />
                        </div>
                        <div className="field-option-radio-group">
                            <label>Range</label>
                            <RadioGroupInput
                                formsy={false}
                                name="scaleType"
                                onValueChange={onScaleTypeChange}
                                options={scaleTypeOptions}
                            />
                        </div>
                        {scale.type === 'manual' && (
                            <div className="chart-builder-scale-range-inputs">
                                <input
                                    className="chart-builder-field-footer-input"
                                    name="scaleMin"
                                    onBlur={onScaleRangeBlur}
                                    onChange={onScaleMinChange}
                                    placeholder="Min"
                                    type="number"
                                    value={scale.min ?? ''}
                                />
                                <span>&nbsp;&nbsp;-&nbsp;</span>
                                <input
                                    className="chart-builder-field-footer-input"
                                    name="scaleMax"
                                    onBlur={onScaleRangeBlur}
                                    onChange={onScaleMaxChange}
                                    placeholder="Max"
                                    type="number"
                                    value={scale.max ?? ''}
                                />
                                {invalidRange && <div className="text-danger">Invalid range (Max &lt;= Min)</div>}
                            </div>
                        )}
                    </Popover>
                }
                triggerType="click"
            >
                <span className="fa fa-gear" />
            </OverlayTrigger>
        </div>
    );
});
ChartFieldRangeScaleOptions.displayName = 'ChartFieldRangeScaleOptions';
