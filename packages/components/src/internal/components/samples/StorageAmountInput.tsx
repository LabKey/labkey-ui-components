import React, { FC, memo, useCallback } from 'react';

import { Alert } from '../base/Alert';
import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';
import { LabelHelpTip } from '../base/LabelHelpTip';
import {
    getMeasurementUnit,
    getMetricUnitOptions,
    getVolumeMinStep,
    isMeasurementUnitIgnoreCase,
    UnitModel,
} from '../../util/measurement';

const negativeValueMessage = (
    <Alert bsStyle="danger" className="storage-item-precision-alert">
        Amount must be a non-negative value.
    </Alert>
);

interface Props {
    amountChangedHandler: (amount: string) => void;
    className?: string;
    inputName?: string;
    label: string;
    model: UnitModel;
    preferredUnit: string;
    tipText?: string;
    unitsChangedHandler?: (units: string) => void;
}

export const StorageAmountInput: FC<Props> = memo(props => {
    const { className, model, preferredUnit, inputName, label, tipText, amountChangedHandler, unitsChangedHandler } =
        props;

    const isNegativeValue = model?.value < 0;
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
                className="form-control checkin-unit-input"
                onChange={(evt: any) => unitsChangedHandler(evt.target.value)}
                placeholder="Enter volume units..."
                type="text"
                value={unitText}
            />
        );
    } else {
        // IFF preferred units nor provided or are a supported type, then show possible conversions
        unitDisplay = (
            <SelectInput
                containerClass="checkin-unit-select-container"
                inputClass="checkin-unit-select"
                name="unitType"
                onChange={(name, formValue, option: SelectInputOption) => {
                    unitsChangedHandler(formValue === undefined && option ? option.id : formValue);
                }}
                options={getMetricUnitOptions(preferredUnit)}
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

    const onChange = useCallback(event => amountChangedHandler(event?.target?.value), [amountChangedHandler]);
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
                    min={0}
                    name={inputName ?? 'amountDelta'}
                    onChange={onChange}
                    placeholder="Enter amount..."
                    step={getVolumeMinStep(model.unit)}
                    type="number"
                    value={model.value ?? ''}
                />
                {unitDisplay}
                {preferredUnitMessage}
            </div>
            {isNegativeValue ? negativeValueMessage : undefined}
        </>
    );
});
