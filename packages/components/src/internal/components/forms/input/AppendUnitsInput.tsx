import React, { FC, memo } from 'react';

import { addValidationRule, validationRules } from 'formsy-react';

import { InputRendererProps } from './types';
import { TextInput } from './TextInput';

const isNumericWithError = (values: any, v: string | number): any =>
    validationRules.isNumeric(values, v) || 'Please enter a number.';

export const AppendUnitsInput: FC<InputRendererProps> = memo(props => {
    const { col, formsy, initiallyDisabled, inputClass, showLabel, value } = props;

    // Issue 23462: Global Formsy validation rule for numbers
    if (!validationRules.isNumericWithError) {
        addValidationRule('isNumericWithError', isNumericWithError);
    }

    // If/when we migrate away from formsy we can implement this using our non-formsy input component
    if (!formsy) {
        console.warn('AppendUnitsInput is only supported in Formsy-based forms.');
        return null;
    }

    return (
        <TextInput
            addonAfter={<span>{col.units}</span>}
            elementWrapperClassName={inputClass}
            initiallyDisabled={initiallyDisabled}
            queryColumn={col}
            showLabel={showLabel}
            validations="isNumericWithError"
            value={value}
        />
    );
});

AppendUnitsInput.displayName = 'AppendUnitsInput';
