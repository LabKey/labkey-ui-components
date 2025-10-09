import React, { ChangeEvent, FC, memo, useCallback, useMemo } from 'react';
import { OverlayTrigger } from '../../OverlayTrigger';
import { Popover } from '../../Popover';
import { RadioGroupInput, RadioGroupOption } from '../forms/input/RadioGroupInput';

import { BAR_CHART_AGGREGATE_NAME } from './constants';
import { ChartFieldInfo, ChartTypeInfo } from './models';
import { LabelOverlay } from '../forms/LabelOverlay';
import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';

const BAR_CHART_AGGREGATE_METHODS = [
    { label: 'Count (non-blank)', value: 'COUNT' },
    { label: 'Sum', value: 'SUM' },
    { label: 'Min', value: 'MIN' },
    { label: 'Max', value: 'MAX' },
    { label: 'Mean', value: 'MEAN' },
    { label: 'Median', value: 'MEDIAN' },
];
const BAR_CHART_AGGREGATE_METHOD_TIP =
    'The aggregate method that will be used to determine the bar height for a given x-axis category / dimension. Field values that are blank are not included in calculated aggregate values.';

const ERROR_BAR_TYPES = [
    { value: null, label: 'None' },
    { value: 'SD', label: 'Standard Deviation' },
    { value: 'SEM', label: 'Standard Error of the Mean' },
];

interface Props {
    field: ChartFieldInfo;
    fieldValues: Record<string, SelectInputOption>;
    onSelectFieldChange: (name: string, value: string, selectedOption: SelectInputOption) => void;
}

export const ChartFieldAggregateOptions: FC<Props> = memo(props => {
    const { field, fieldValues, onSelectFieldChange } = props;
    const fieldValue = fieldValues?.[field.name];
    const aggregateValue = fieldValues?.[BAR_CHART_AGGREGATE_NAME]?.value;

    const errorBarOptions = useMemo(() => {
        return ERROR_BAR_TYPES.map(
            option =>
                ({
                    ...option,
                    selected: null === option.value, // TODO
                }) as RadioGroupOption
        );
    }, []);

    const onErrorBarChange = useCallback(
        (selected: string) => {
            console.log(field.name, selected);
        },
        [field.name]
    );

    if (!fieldValue?.value) {
        return null;
    }

    return (
        <div className="field-option-icon">
            <OverlayTrigger
                overlay={
                    <Popover id="chart-field-option-popover" placement="left">
                        <div>
                            <label>
                                Aggregate Method{' '}
                                <LabelOverlay placement="bottom">{BAR_CHART_AGGREGATE_METHOD_TIP}</LabelOverlay>
                            </label>
                            <SelectInput
                                clearable={false}
                                inputClass="col-xs-12"
                                name={BAR_CHART_AGGREGATE_NAME}
                                onChange={onSelectFieldChange}
                                options={BAR_CHART_AGGREGATE_METHODS}
                                placeholder="Select aggregate method"
                                showLabel={false}
                                value={aggregateValue ?? 'SUM'}
                            />
                        </div>
                        {/*<div className="field-option-radio-group">*/}
                        {/*    <label>Error Bars</label>*/}
                        {/*    <br/>*/}
                        {/*    <RadioGroupInput*/}
                        {/*        formsy={false}*/}
                        {/*        name="errorBars"*/}
                        {/*        onValueChange={onErrorBarChange}*/}
                        {/*        options={errorBarOptions}*/}
                        {/*    />*/}
                        {/*</div>*/}
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
