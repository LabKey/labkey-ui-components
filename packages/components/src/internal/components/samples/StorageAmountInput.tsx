import React, { FC, memo } from 'react';

import { FormControl } from 'react-bootstrap';

import { AMOUNT_PRECISION_ERROR_TEXT } from './constants';
import { Alert } from '../base/Alert';
import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';
import { LabelHelpTip } from '../base/LabelHelpTip';
import {
    getAltMetricUnitOptions,
    getVolumeMinStep,
    isMeasurementUnitIgnoreCase,
    isValuePrecisionValid,
    MEASUREMENT_UNITS,
    UnitModel,
} from '../../util/measurement';

const deltaTooPreciseMessage = (
    <Alert bsStyle="danger" className="storage-item-precision-alert">
        {AMOUNT_PRECISION_ERROR_TEXT}
    </Alert>
);
const negativeValueMessage = (
    <Alert bsStyle="danger" className="storage-item-precision-alert">
        Amount must be a positive value.
    </Alert>
);

interface Props {
    className?: string;
    model: UnitModel;
    preferredUnit: string;
    inputName?: string;
    label: string;
    tipText?: string;
    amountChangedHandler: (amount: string) => void;
    unitsChangedHandler?: (units: string) => void;
}

export const StorageAmountInput: FC<Props> = memo(props => {
    const {className, model, preferredUnit, inputName, label, tipText, amountChangedHandler, unitsChangedHandler} = props;

    const isNegativeValue = model?.value < 0;
    const isDeltaValid = isValuePrecisionValid(model?.value, model?.unit?.displayPrecision);
    const unitText = model?.unit?.label || model.unitStr;
    let preferredUnitMessage;

    let unitDisplay;
    if (!unitsChangedHandler) {
        //IF we don't have a way to change the supported value show it as static text.
        unitDisplay = <span className="storage-item-unit-text margin-left">{preferredUnit || (unitText)}</span>;
    }
    //If preferred unit isn't set or is an unsupported value allow editing as text
    else if (preferredUnit == undefined || !MEASUREMENT_UNITS.hasOwnProperty(preferredUnit.toLowerCase())) {
        unitDisplay = <FormControl
            type="text"
            className="checkin-unit-input"
            value={unitText}
            placeholder="Enter volume units..."
            onChange={(evt: any) => unitsChangedHandler(evt.target.value)}
        />;
    }
    else {
        //IFF preferred units are supplied and are a supported type, then show possible conversions
        unitDisplay = <SelectInput
            containerClass="checkin-unit-select-container"
            inputClass="checkin-unit-select"
            name="unitType"
            options={getAltMetricUnitOptions(preferredUnit)}
            onChange={(name, formValue, option: SelectInputOption) => {
                unitsChangedHandler(formValue === undefined && option ? option.id : formValue);
            }}
            value={preferredUnit}
        />;

        if (model.unit !== null && !isMeasurementUnitIgnoreCase(model.unit, preferredUnit)) {
            const preferredUnitText = model.as(preferredUnit).toString();
            preferredUnitMessage = <div><span className={'storage-item-check-in-preferred-display'}>{preferredUnitText} equivalent (preferred)</span></div>
        }
    }

    const containerClassName = className ?? "form-group storage-item-check-in-sampletype-row ";
    return (
        <>
            <div className={containerClassName}>
                <div className={"checkin-amount-label " + (isDeltaValid ? "" : "has-error ")} >
                    <label>{label}</label>
                    {tipText && <LabelHelpTip placement="top" title="Stored Amount Delta"><p>{tipText}</p></LabelHelpTip>}
                </div>
                <FormControl
                    className="storage-item-check-in-text storage-amount-input "
                    min={0}
                    step={getVolumeMinStep(model.unit)}
                    name={inputName ?? "amountDelta"}
                    onChange={(event:any) => amountChangedHandler(event?.target?.value)}
                    type="number"
                    value={model.value}
                    placeholder={"Enter amount..."}
                />
                {unitDisplay}
                {preferredUnitMessage}
            </div>
            {isNegativeValue ? negativeValueMessage : undefined}
            {!isNegativeValue && !isDeltaValid ? deltaTooPreciseMessage : undefined}
        </>
    );
});
