import React from 'react';

import { render } from '@testing-library/react';

import { waitFor } from '@testing-library/dom';

import { MockLookupProvider } from '../../../test/MockLookupProvider';

import { DomainField } from './models';
import { createFormInputId } from './utils';
import { DOMAIN_FIELD_NOT_LOCKED, DOMAIN_FIELD_SAMPLE_TYPE, INT_RANGE_URI, SAMPLE_TYPE_CONCEPT_URI } from './constants';
import { SampleFieldOptions } from './SampleFieldOptions';

describe('SampleFieldOptions', () => {
    test('Sample field options', async () => {
        const _container = '/StudyVerifyProject/My Study';
        const _index = 1;
        const _domainIndex = 1;
        const _label = 'Sample Options';
        const sampleFieldId = createFormInputId(DOMAIN_FIELD_SAMPLE_TYPE, _domainIndex, _index);

        const field = DomainField.create({
            name: 'key',
            conceptURI: SAMPLE_TYPE_CONCEPT_URI,
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });

        render(
            <MockLookupProvider>
                <SampleFieldOptions
                    original={field}
                    index={_index}
                    domainIndex={_domainIndex}
                    container={_container}
                    onChange={jest.fn()}
                    label={_label}
                    lockType={DOMAIN_FIELD_NOT_LOCKED}
                />
            </MockLookupProvider>
        );

        await waitFor(() => {
            expect(document.getElementById(sampleFieldId)).not.toBeNull();
        });

        // Verify section label
        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel[0].textContent).toEqual(_label);
    });
});
