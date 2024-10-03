import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { MockLookupProvider } from '../../../test/MockLookupProvider';

import { ITargetTableSelectImplState, TargetTableSelectProps } from './Lookup/Fields';
import { DomainField } from './models';
import { createFormInputId, createFormInputName } from './utils';
import { DOMAIN_FIELD_NOT_LOCKED, DOMAIN_FIELD_SAMPLE_TYPE, INT_RANGE_URI, SAMPLE_TYPE_CONCEPT_URI } from './constants';
import { SampleFieldOptions } from './SampleFieldOptions';

describe('SampleFieldOptions', () => {
    const waitForLoad = jest.fn(field => Promise.resolve(!field.state().loading));

    const sampleFieldSelector = (
        field: ReactWrapper<any>,
        domainIndex: number,
        index: number
    ): ReactWrapper<TargetTableSelectProps, ITargetTableSelectImplState> => {
        const config = {
            id: createFormInputId(DOMAIN_FIELD_SAMPLE_TYPE, domainIndex, index),
            name: createFormInputName(DOMAIN_FIELD_SAMPLE_TYPE),
        };

        return field.find(config).not({ bsClass: 'form-control' });
    };

    // Tests
    test('Sample field options', () => {
        const _container = '/StudyVerifyProject/My Study';
        const _index = 1;
        const _domainIndex = 1;
        const _label = 'Sample Options';
        const _allSamples = 'All Samples';

        const field = DomainField.create({
            name: 'key',
            conceptURI: SAMPLE_TYPE_CONCEPT_URI,
            rangeURI: INT_RANGE_URI,
            propertyId: 1,
            propertyURI: 'test',
        });

        const sampleField = mount(
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
        expect(sampleField.length).toEqual(1);

        // Verify section label
        const sectionLabel = sampleField.find('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual(_label);

        return waitForLoad(sampleField).then(() => {
            const selectorField = sampleFieldSelector(sampleField, _domainIndex, _index);
            expect(selectorField.props().value).toEqual(_allSamples); // Verify default
            sampleField.unmount();
        });
    });
});
