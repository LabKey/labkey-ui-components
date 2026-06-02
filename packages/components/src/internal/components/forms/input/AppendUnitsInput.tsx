/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';

import { addFormsyRule, formsyRules } from '../formsy';

import { InputRendererProps } from './types';
import { TextInput } from './TextInput';

const isNumericWithError = (values: any, v: string | number): any =>
    formsyRules.isNumeric(values, v) || 'Please enter a number.';

export const AppendUnitsInput: FC<InputRendererProps> = memo(props => {
    const { col, formsy, inputClass, showLabel, value, ...otherProps } = props;
    const { allowFieldDisable, initiallyDisabled, onToggleDisable } = otherProps;

    // Issue 23462: Global Formsy validation rule for numbers
    if (!formsyRules.isNumericWithError) {
        addFormsyRule('isNumericWithError', isNumericWithError);
    }

    // If/when we migrate away from formsy we can implement this using our non-formsy input component
    if (!formsy) {
        console.warn('AppendUnitsInput is only supported in Formsy-based forms.');
        return null;
    }

    return (
        <TextInput
            allowDisable={allowFieldDisable}
            initiallyDisabled={initiallyDisabled}
            onToggleDisable={onToggleDisable}
            addonAfter={<span>{col.units}</span>}
            elementWrapperClassName={inputClass}
            queryColumn={col}
            showLabel={showLabel}
            validations="isNumericWithError"
            value={value}
        />
    );
});

AppendUnitsInput.displayName = 'AppendUnitsInput';
