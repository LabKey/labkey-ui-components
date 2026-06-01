/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useMemo } from 'react';
import { OverlayTrigger } from '../../OverlayTrigger';
import { Popover } from '../../Popover';
import { ChartConfig, ChartConfigSetter, ChartFieldInfo, ChartLabels, ChartTypeInfo, ScaleType } from './models';
import { getFieldDataType, shouldShowAggregateOptions, shouldShowRangeScaleOptions } from './utils';
import { LABKEY_VIS } from '../../constants';
import { ChartFieldAggregateOptions } from './ChartFieldAggregateOptions';
import { ChartFieldRangeScaleOptions } from './ChartFieldRangeScaleOptions';
import { ChartLabelInput } from './ChartLabelInput';

interface Props {
    chartConfig: ChartConfig;
    field: ChartFieldInfo;
    onLabelChange: (key: keyof ChartLabels, value: string) => void;
    onScaleChange: (scale: Partial<ScaleType>, localOnly?: boolean) => void;
    scale: ScaleType;
    selectedType: ChartTypeInfo;
    setChartConfig: ChartConfigSetter;
}

export const ChartFieldAdditionalOptions: FC<Props> = memo(props => {
    const { chartConfig, field, onLabelChange, onScaleChange, scale, selectedType, setChartConfig } = props;
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
            <ChartLabelInput
                label={field.label}
                name={field.name as keyof ChartLabels}
                onChange={onLabelChange}
                value={chartConfig.labels?.[field.name]}
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
