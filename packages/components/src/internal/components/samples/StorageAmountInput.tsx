/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useState } from 'react';

import { Alert } from '../base/Alert';
import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';
import { LabelHelpTip } from '../base/LabelHelpTip';
import {
    getMeasurementUnit,
    getMetricUnitOptions,
    isMeasurementUnitIgnoreCase,
    UnitModel,
} from '../../util/measurement';
import { getInvalidSampleAmountMessage } from '../../util/utils';

interface Props {
    amountChangedHandler: (amount: string) => void;
    className?: string;
    inputName?: string;
    label: string;
    metricUnitsFilterFn?: (option: { label: string; value: string }) => boolean;
    model: UnitModel;
    preferredUnit: string;
    tipText?: string;
    unitsChangedHandler?: (units: string) => void;
}

export const StorageAmountInput: FC<Props> = memo(props => {
    const {
        className,
        model,
        preferredUnit,
        inputName,
        label,
        tipText,
        amountChangedHandler,
        unitsChangedHandler,
        metricUnitsFilterFn,
    } = props;
    const [amountInput, setAmountInput] = useState<string>(model?.value?.toString() || '');

    const unitText = model?.unit?.label || model.unitStr;
    let preferredUnitMessage;

    let unitDisplay;
    if (!unitsChangedHandler) {
        // IF we don't have a way to change the supported value show it as static text.
        unitDisplay = <span className="storage-item-unit-text margin-left">{unitText || preferredUnit}</span>;
    }
    // If unitText is provided and not a supported unit type, allow editing as text
    else if (unitText && !getMeasurementUnit(unitText)) {
        unitDisplay = (
            <input
                aria-label="Units"
                className="form-control checkin-unit-input"
                onChange={(evt: any) => unitsChangedHandler(evt.target.value)}
                placeholder="Enter volume units..."
                type="text"
                value={unitText}
            />
        );
    } else {
        // IFF preferred units nor provided or are a supported type, then show possible conversions

        const options = getMetricUnitOptions(preferredUnit, false, metricUnitsFilterFn);
        unitDisplay = (
            <SelectInput
                containerClass="checkin-unit-select-container"
                inputClass="checkin-unit-select"
                name="unitType"
                onChange={(name, formValue, option: SelectInputOption) => {
                    unitsChangedHandler(formValue === undefined && option ? option.id : formValue);
                }}
                options={options}
                value={model.unit?.label}
            />
        );

        if (
            preferredUnit &&
            model.unit !== null &&
            model.value &&
            !isMeasurementUnitIgnoreCase(model.unit, preferredUnit)
        ) {
            const preferredUnitText = model.as(preferredUnit).toString();
            preferredUnitMessage = (
                <div>
                    <span className="storage-item-check-in-preferred-display">Displayed as {preferredUnitText}</span>
                </div>
            );
        }
    }

    const onChange = useCallback(
        event => {
            const newValue = event?.target?.value;
            amountChangedHandler(newValue);
            setAmountInput(newValue);
        },
        [amountChangedHandler]
    );

    const containerClassName = className ?? 'form-group storage-item-check-in-sampletype-row ';
    return (
        <>
            <div className={containerClassName}>
                <div className={'checkin-amount-label'}>
                    <label htmlFor="checkin-amount">{label}</label>
                    {tipText && (
                        <LabelHelpTip title="Stored Amount Delta">
                            <p>{tipText}</p>
                        </LabelHelpTip>
                    )}
                </div>
                <input
                    className="form-control storage-item-check-in-text storage-amount-input "
                    id="checkin-amount"
                    name={inputName ?? 'amountDelta'}
                    onChange={onChange}
                    placeholder="Enter amount..."
                    type="text"
                    value={amountInput}
                />
                {unitDisplay}
                {preferredUnitMessage}
            </div>
            <Alert bsStyle="danger" className="storage-item-precision-alert">
                {getInvalidSampleAmountMessage(amountInput)}
            </Alert>
        </>
    );
});
