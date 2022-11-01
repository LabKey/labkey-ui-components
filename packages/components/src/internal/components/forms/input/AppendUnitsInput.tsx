import React, { FC, memo, useEffect } from 'react';

import { Input } from 'formsy-react-components';
import { addValidationRule, validationRules } from 'formsy-react';

import { InputRendererProps } from './types';
import { LabelOverlay } from '../LabelOverlay';

export const AppendUnitsInput: FC<InputRendererProps> = memo(props => {
    const { col, formsy, initiallyDisabled, value } = props;

    useEffect(() => {
        // Issue 23462: Global Formsy validation rule for numbers
        if (!validationRules.isNumericWithError) {
            addValidationRule(
                'isNumericWithError',
                (values: any, v: string | number) => validationRules.isNumeric(values, v) || 'Please enter a number.'
            );
        }
    }, []);

    // If/when we migrate away from formsy we can implement this using our non-formsy input component
    if (!formsy) {
        console.warn('AppendUnitsInput is only supported in Formsy-based forms.');
        return null;
    }

    return (
        <Input
            disabled={initiallyDisabled}
            addonAfter={<span>{col.units}</span>}
            changeDebounceInterval={0}
            elementWrapperClassName="col-md-9 col-xs-12"
            id={col.name}
            label={<LabelOverlay column={col} inputId={col.name} />}
            labelClassName="control-label text-left col-xs-12"
            name={col.name}
            required={col.required}
            type="text"
            validations="isNumericWithError"
            value={value}
        />
    );
});

AppendUnitsInput.displayName = 'AppendUnitsInput';
