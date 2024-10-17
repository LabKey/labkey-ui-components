import React from 'react';
import { List } from 'immutable';

import { render } from '@testing-library/react';

import { BaseDomainDesigner } from './BaseDomainDesigner';
import { DomainDesign } from './models';
import { SEVERITY_LEVEL_ERROR } from './constants';

const BASE_PROPS = {
    hasValidProperties: true,
    exception: undefined,
    domains: List.of(DomainDesign.create({})),
    name: 'Test',
    submitting: false,
    visitedPanels: List.of(0),
    onCancel: jest.fn(),
    onFinish: jest.fn(),
};

describe('BaseDomainDesigner', () => {
    function buttonValidation(saveBtnText: string, saveDisabled: boolean): void {
        expect(document.querySelectorAll('.cancel-button')).toHaveLength(1);
        expect(document.querySelector('.save-button').textContent).toBe(saveBtnText);
        expect(document.querySelector('.save-button').hasAttribute('disabled')).toBe(saveDisabled);
    }

    test('without error', () => {
        render(<BaseDomainDesigner {...BASE_PROPS} />);
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelectorAll('.form-buttons')).toHaveLength(1);
        buttonValidation('Save', false);
    });

    test('hasValidProperties', () => {
        render(<BaseDomainDesigner {...BASE_PROPS} hasValidProperties={false} />);
        expect(document.querySelectorAll('.alert')).toHaveLength(1);
        expect(document.querySelector('.alert').textContent).toBe(
            'Please correct errors in the properties panel before saving.'
        );
        expect(document.querySelectorAll('.form-buttons')).toHaveLength(1);
        buttonValidation('Save', false);
    });

    test('exception', () => {
        render(<BaseDomainDesigner {...BASE_PROPS} exception="Test exception text" />);
        expect(document.querySelectorAll('.alert')).toHaveLength(1);
        expect(document.querySelector('.alert').textContent).toBe('Test exception text');
        expect(document.querySelectorAll('.form-buttons')).toHaveLength(1);
        buttonValidation('Save', false);
    });

    test('errorDomains', () => {
        render(
            <BaseDomainDesigner
                {...BASE_PROPS}
                domains={List.of(
                    DomainDesign.create(
                        { name: BASE_PROPS.name },
                        { exception: 'test1', severity: SEVERITY_LEVEL_ERROR }
                    )
                )}
            />
        );
        expect(document.querySelectorAll('.alert')).toHaveLength(1);
        expect(document.querySelector('.alert').textContent).toBe('Please correct errors in Test before saving.');
        expect(document.querySelectorAll('.form-buttons')).toHaveLength(1);
        buttonValidation('Save', false);
    });

    test('submitting, saveBtnText', () => {
        render(<BaseDomainDesigner {...BASE_PROPS} submitting={true} saveBtnText="Finish" />);
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelectorAll('.form-buttons')).toHaveLength(1);
        buttonValidation('Finish', true);
    });
});
