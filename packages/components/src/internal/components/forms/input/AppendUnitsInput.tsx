import React, { FC, memo, useEffect } from 'react';

import { Input } from 'formsy-react-components';
import { addValidationRule, validationRules } from 'formsy-react';

import { InputRendererProps } from './types';
import { LabelOverlay } from '../LabelOverlay';

export const AppendUnitsInput: FC<InputRendererProps> = memo(props => {
    const { allowFieldDisable, col, initiallyDisabled, isDetailInput, value } = props;

    useEffect(() => {
        // Issue 23462: Global Formsy validation rule for numbers
        if (!validationRules.isNumericWithError) {
            addValidationRule(
                'isNumericWithError',
                (values: any, v: string | number) => validationRules.isNumeric(values, v) || 'Please enter a number.'
            );
        }
    }, []);

    return (
        <Input
            allowDisable={allowFieldDisable}
            disabled={initiallyDisabled}
            addonAfter={<span>{col.units}</span>}
            changeDebounceInterval={0}
            elementWrapperClassName={isDetailInput ? [{ 'col-sm-9': false }, 'col-sm-12'] : undefined}
            id={col.name}
            label={<LabelOverlay column={col} inputId={col.name} />}
            labelClassName="control-label text-left"
            name={col.name}
            required={col.required}
            type="text"
            validations="isNumericWithError"
            value={value}
        />
    );
});

AppendUnitsInput.displayName = 'AppendUnitsInput';
