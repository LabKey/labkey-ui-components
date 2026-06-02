/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { createFormInputId } from './utils';
import {
    DOMAIN_FIELD_CUSTOM_LENGTH,
    DOMAIN_FIELD_MAX_LENGTH,
    DOMAIN_FIELD_NOT_LOCKED,
    DOMAIN_FIELD_SCALE,
    MAX_TEXT_LENGTH,
} from './constants';

import { TextFieldOptions } from './TextFieldOptions';

const SCANNABLE_OPTION_SELECTOR = '.domain-text-option-scannable';

describe('TextFieldOptions', () => {
    const DEFAULT_PROPS = {
        index: 1,
        domainIndex: 1,
        label: 'Text Field Options',
        scale: MAX_TEXT_LENGTH,
        onChange: jest.fn(),
        lockType: DOMAIN_FIELD_NOT_LOCKED,
    };

    const maxLengthId = `#${createFormInputId(DOMAIN_FIELD_MAX_LENGTH, 1, 1)}`;
    const customLengthId = `#${createFormInputId(DOMAIN_FIELD_CUSTOM_LENGTH, 1, 1)}`;
    const scaleId = `#${createFormInputId(DOMAIN_FIELD_SCALE, 1, 1)}`;

    test('Text data type - scale MAX_TEXT_LENGTH', () => {
        renderWithAppContext(<TextFieldOptions {...DEFAULT_PROPS} scale={MAX_TEXT_LENGTH} />);

        // Verify label
        expect(document.querySelector('.domain-field-section-heading')).toHaveTextContent('Text Field Options');

        // Verify max length is not checked for scale 4000
        expect(document.querySelector(maxLengthId)).not.toBeChecked();

        // Custom length is checked for scale 4000
        expect(document.querySelector(customLengthId)).toBeChecked();

        // Custom value
        expect(document.querySelector(scaleId)).toHaveValue(MAX_TEXT_LENGTH);
    });

    test('Text data type - scale > MAX_TEXT_LENGTH reverts to unlimited', () => {
        // using a value larger than the max length of 4000, will revert back to unlimited
        renderWithAppContext(<TextFieldOptions {...DEFAULT_PROPS} scale={4001} />);

        // max length radio should be checked (radio state = DOMAIN_FIELD_MAX_LENGTH)
        expect(document.querySelector(maxLengthId)).toBeChecked();

        // Scale input shows MAX_TEXT_LENGTH
        expect(document.querySelector(scaleId)).toHaveValue(MAX_TEXT_LENGTH);
    });

    test('Text data type - custom scale', () => {
        renderWithAppContext(<TextFieldOptions {...DEFAULT_PROPS} scale={200} />);

        // custom length radio should be checked (radio state = DOMAIN_FIELD_CUSTOM_LENGTH)
        expect(document.querySelector(customLengthId)).toBeChecked();

        // Scale input shows 200
        expect(document.querySelector(scaleId)).toHaveValue(200);
    });

    test('Scannable Option field not shown - showScannableOption false, appPropertiesOnly false', () => {
        renderWithAppContext(
            <TextFieldOptions {...DEFAULT_PROPS} showScannableOption={false} appPropertiesOnly={false} />
        );
        expect(document.querySelectorAll(SCANNABLE_OPTION_SELECTOR)).toHaveLength(0);
    });

    test('Scannable Option field not shown - showScannableOption true, appPropertiesOnly false', () => {
        renderWithAppContext(
            <TextFieldOptions {...DEFAULT_PROPS} showScannableOption={true} appPropertiesOnly={false} />
        );
        expect(document.querySelectorAll(SCANNABLE_OPTION_SELECTOR)).toHaveLength(0);
    });

    test('Scannable Option field not shown - showScannableOption false, appPropertiesOnly true', () => {
        renderWithAppContext(
            <TextFieldOptions {...DEFAULT_PROPS} showScannableOption={false} appPropertiesOnly={true} />
        );
        expect(document.querySelectorAll(SCANNABLE_OPTION_SELECTOR)).toHaveLength(0);
    });

    test('Scannable Option field shown and default false', () => {
        renderWithAppContext(
            <TextFieldOptions {...DEFAULT_PROPS} appPropertiesOnly={true} showScannableOption={true} />
        );
        const scannable = document.querySelector(SCANNABLE_OPTION_SELECTOR);
        expect(scannable).toBeInTheDocument();
        expect(scannable).not.toBeChecked();
    });

    test('Scannable Option value - scannable true', () => {
        renderWithAppContext(
            <TextFieldOptions {...DEFAULT_PROPS} showScannableOption={true} appPropertiesOnly={true} scannable={true} />
        );
        expect(document.querySelector(SCANNABLE_OPTION_SELECTOR)).toBeChecked();
    });

    test('Scannable Option value - scannable false', () => {
        renderWithAppContext(
            <TextFieldOptions
                {...DEFAULT_PROPS}
                showScannableOption={true}
                appPropertiesOnly={true}
                scannable={false}
            />
        );
        expect(document.querySelector(SCANNABLE_OPTION_SELECTOR)).not.toBeChecked();
    });
});
