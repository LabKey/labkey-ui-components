import React from 'react';
import { render } from '@testing-library/react';

import { DomainRowWarning } from './DomainRowWarning';
import { DomainFieldError } from './models';

describe('DomainRowWarning', () => {
    test('without extra info', () => {
        render(
            <DomainRowWarning fieldError={new DomainFieldError({ message: 'Test Warning', severity: 'Warning' })} />
        );
        expect(document.querySelector('.domain-row-warning').textContent).toBe('Warning: Test Warning');
    });

    test('with extra info', () => {
        render(
            <DomainRowWarning
                fieldError={
                    new DomainFieldError({ message: 'Test Warning', severity: 'Warning', extraInfo: 'Test Extra' })
                }
            />
        );
        expect(document.querySelectorAll('.label-help-target')).toHaveLength(1);
    });
});
