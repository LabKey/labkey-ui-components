import React, { ChangeEvent, FC, memo, PropsWithChildren, useCallback, useMemo } from 'react';
import { OverlayTrigger } from '../../OverlayTrigger';
import { Popover } from '../../Popover';
import { RadioGroupInput } from '../forms/input/RadioGroupInput';

import { ScaleType } from './models';

const SCALE_TRANS_TYPES = [
    { value: 'linear', label: 'Linear' },
    { value: 'log', label: 'Log' },
];

const SCALE_RANGE_TYPES = [
    { value: 'automatic', label: 'Automatic' },
    { value: 'manual', label: 'Manual' },
];

interface OwnProps extends PropsWithChildren {
    onScaleChange: (scale: Partial<ScaleType>, localOnly?: boolean) => void;
    scale: ScaleType;
    showScaleTrans: boolean;
}

export const ChartFieldRangeScaleOptions: FC<OwnProps> = memo(props => {
    const { scale, onScaleChange, showScaleTrans, children } = props;
    const placement = useMemo(() => (!showScaleTrans && children ? 'left' : 'bottom'), [showScaleTrans, children]);

    const scaleTransOptions = useMemo(() => {
        return SCALE_TRANS_TYPES.map(option => ({ ...option, selected: scale.trans === option.value }));
    }, [scale.trans]);

    const scaleTypeOptions = useMemo(() => {
        return SCALE_RANGE_TYPES.map(option => ({ ...option, selected: scale.type === option.value }));
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
            onScaleChange({ trans: selected });
        },
        [onScaleChange]
    );

    const onScaleTypeChange = useCallback(
        (selected: string) => {
            let scale_: Partial<ScaleType> = { type: selected };
            if (selected === 'automatic') scale_ = { ...scale_, min: undefined, max: undefined };
            onScaleChange(scale_);
        },
        [onScaleChange]
    );

    const onScaleMinChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            onScaleChange({ min: event.target.value }, true);
        },
        [onScaleChange]
    );

    const onScaleMaxChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            onScaleChange({ max: event.target.value }, true);
        },
        [onScaleChange]
    );

    const onScaleRangeBlur = useCallback(() => {
        if (invalidRange) return;
        onScaleChange({
            min: parseFloat(scale.min?.toString()),
            max: parseFloat(scale.max?.toString()),
        });
    }, [invalidRange, onScaleChange, scale]);

    return (
        <div className="field-option-icon">
            <OverlayTrigger
                overlay={
                    <Popover id="chart-field-option-popover" placement={placement}>
                        {children}
                        {showScaleTrans && (
                            <div className="field-option-radio-group">
                                <label>Scale</label>
                                <RadioGroupInput
                                    formsy={false}
                                    name="scaleTrans"
                                    onValueChange={onScaleTransChange}
                                    options={scaleTransOptions}
                                />
                            </div>
                        )}
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
                                <span className="chart-builder-field-footer-input">-</span>
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
