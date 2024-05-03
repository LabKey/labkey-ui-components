import React from 'react';

import { TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT } from '../../productFixtures';

import { getStatusTagStyle, hexToRGB, SampleStatusTag } from './SampleStatusTag';

import {
    DEFAULT_AVAILABLE_STATUS_COLOR,
    DEFAULT_CONSUMED_STATUS_COLOR,
    DEFAULT_LOCKED_STATUS_COLOR,
    SampleStateType,
} from './constants';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

describe('SampleStatusTag', () => {
    const serverContext = { moduleContext: TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT };

    const lockedStatus = {
        label: 'Locked for testing',
        statusType: SampleStateType.Locked,
        description: 'Locked description',
        color: DEFAULT_LOCKED_STATUS_COLOR,
    };

    const consumedStatus = {
        label: 'Consumed for testing',
        statusType: SampleStateType.Consumed,
        description: 'Consumed description',
        color: DEFAULT_CONSUMED_STATUS_COLOR,
    };

    const availableStatus = {
        label: 'Available for testing',
        statusType: SampleStateType.Available,
        description: 'Available description',
        color: DEFAULT_AVAILABLE_STATUS_COLOR,
    };

    const availableNoDescription = {
        label: 'Also available',
        statusType: SampleStateType.Available,
        color: '#FAFAFA',
    };

    function validateIconOnly(): void {
        const helpTip = document.querySelector('.label-help-target');
        expect(helpTip).not.toBeNull();
        const icon = document.querySelector('i');
        expect(icon).not.toBeNull();
    }

    function validateNotIconOnly(expectedText: string, hasHelpTip = true): void {
        const spans = document.querySelectorAll('span');
        expect(spans).toHaveLength(hasHelpTip ? 3 : 1);
        expect(spans.item(hasHelpTip ? 2 : 0).textContent).toBe(expectedText);
        if (hasHelpTip) {
            expect(document.querySelector('.label-help-target')).toBeTruthy();
        } else {
            expect(document.querySelector('.label-help-target')).toBeFalsy();
        }
    }

    test('not enabled', () => {
        renderWithAppContext(<SampleStatusTag status={lockedStatus} />);
        expect(document.querySelector('span')).toBeNull();
    });

    test('enabled, no label', () => {
        renderWithAppContext(
            <SampleStatusTag
                status={{ label: undefined, statusType: SampleStateType.Locked, color: DEFAULT_LOCKED_STATUS_COLOR }}
            />,
            { serverContext }
        );
        expect(document.querySelector('span')).toBeNull();
    });

    test('iconOnly, locked', () => {
        renderWithAppContext(<SampleStatusTag status={lockedStatus} iconOnly />, { serverContext });
        validateIconOnly();
    });

    test('iconOnly, no description', () => {
        renderWithAppContext(<SampleStatusTag status={availableNoDescription} iconOnly />, { serverContext });
        validateIconOnly();
    });

    test('not iconOnly, locked status type', () => {
        renderWithAppContext(<SampleStatusTag status={lockedStatus} />, { serverContext });
        validateNotIconOnly(lockedStatus.label);
    });

    test('consumed status type', () => {
        renderWithAppContext(<SampleStatusTag status={consumedStatus} />, { serverContext });
        validateNotIconOnly(consumedStatus.label);
    });

    test('available status type with description', () => {
        renderWithAppContext(<SampleStatusTag status={availableStatus} />, { serverContext });
        validateNotIconOnly(availableStatus.label);
    });

    test('available status, hide description', () => {
        renderWithAppContext(<SampleStatusTag status={availableStatus} hideDescription />, { serverContext });
        validateNotIconOnly(availableStatus.label, false);
    });

    test('available status type, no description', () => {
        const status = {
            label: 'Also available',
            statusType: SampleStateType.Available,
            color: '#ABABAB',
        };
        renderWithAppContext(<SampleStatusTag status={status} />, { serverContext });
        validateNotIconOnly(status.label, false);
    });
});

describe('hexToRGB', () => {
    test('conversions', () => {
        expect(hexToRGB('#FFFFFF')).toStrictEqual([255, 255, 255]);
        expect(hexToRGB('FFFFFF')).toStrictEqual([255, 255, 255]);
        expect(hexToRGB('#A1B2C3')).toStrictEqual([161, 178, 195]);
        expect(hexToRGB('335CA5')).toStrictEqual([51, 92, 165]);
        expect(hexToRGB(undefined)).toStrictEqual([0, 0, 0]);
    });
});

describe('getStatusTagStyle', () => {
    test('no color', () => {
        expect(
            getStatusTagStyle({ color: undefined, label: 'Custom', statusType: SampleStateType.Available })
        ).toStrictEqual({
            color: '#3C763D',
            backgroundColor: '#F0F8ED',
            borderColor: 'lightgray',
        });
        expect(
            getStatusTagStyle({ color: undefined, label: 'Custom', statusType: SampleStateType.Consumed })
        ).toStrictEqual({
            color: '#8A6D3B',
            backgroundColor: '#FCF8E3',
            borderColor: 'lightgray',
        });
        expect(
            getStatusTagStyle({ color: undefined, label: 'Custom', statusType: SampleStateType.Locked })
        ).toStrictEqual({
            color: '#BF3939',
            backgroundColor: '#FDE6E6',
            borderColor: 'lightgray',
        });
        expect(getStatusTagStyle({ color: undefined, label: 'Custom', statusType: undefined })).toStrictEqual({
            color: '#555555',
            backgroundColor: undefined,
            borderColor: 'lightgray',
        });
    });

    test('standard color', () => {
        expect(
            getStatusTagStyle({ color: '#FDEBF7', label: 'Custom', statusType: SampleStateType.Available })
        ).toStrictEqual({
            color: '#BF1F8A',
            backgroundColor: '#FDEBF7',
            borderColor: 'lightgray',
        });
    });

    test('custom color', () => {
        expect(
            getStatusTagStyle({ color: '#FFFFFF', label: 'Custom', statusType: SampleStateType.Available })
        ).toStrictEqual({
            color: '#555555',
            backgroundColor: '#FFFFFF',
            borderColor: 'lightgray',
        });
        expect(
            getStatusTagStyle({ color: '#7A1D1D', label: 'Custom', statusType: SampleStateType.Consumed })
        ).toStrictEqual({
            color: 'white',
            backgroundColor: '#7A1D1D',
            borderColor: 'lightgray',
        });
    });
});
