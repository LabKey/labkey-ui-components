import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { DOMAIN_FIELD_FULLY_LOCKED } from '../domainproperties/constants';

import { DomainField } from '../domainproperties/models';

import { DomainFieldLabel } from '../domainproperties/DomainFieldLabel';

import { OntologyConceptAnnotation } from './OntologyConceptAnnotation';
import { OntologyBrowserModal } from './OntologyBrowserModal';

const DEFAULT_PROPS = {
    id: 'testId',
    field: new DomainField(),
    onChange: jest.fn,
    error: undefined,
};

const TEST_FIELD = new DomainField({ principalConceptCode: 'code:123' });

describe('OntologyConceptAnnotation', () => {
    function validate(wrapper: ReactWrapper, hasCode: boolean, canRemove = true): void {
        expect(wrapper.find(DomainFieldLabel)).toHaveLength(1);
        expect(wrapper.find('.domain-annotation-table')).toHaveLength(1);
        expect(wrapper.find('.domain-validation-button')).toHaveLength(2);
        expect(getSelectButton(wrapper).text()).toBe('Select Concept');
        expect(wrapper.find('.domain-text-label')).toHaveLength(!hasCode || !canRemove ? 1 : 0);
        if (!hasCode) {
            expect(wrapper.find('.domain-text-label').text()).toBe('None Set');
        }

        expect(wrapper.find('.content')).toHaveLength(hasCode && canRemove ? 3 : 2);
        expect(wrapper.find('.domain-annotation-item')).toHaveLength(hasCode ? 1 : 0);
    }

    function getSelectButton(wrapper: ReactWrapper): ReactWrapper {
        return wrapper.find('.domain-validation-button').first();
    }

    test('no principalConceptCode', () => {
        const wrapper = mount(<OntologyConceptAnnotation {...DEFAULT_PROPS} />);
        validate(wrapper, false);
        expect(wrapper.find('.domain-text-label').text()).toBe('None Set');
        wrapper.unmount();
    });

    test('principalConceptCode', () => {
        const wrapper = mount(<OntologyConceptAnnotation {...DEFAULT_PROPS} field={TEST_FIELD} />);
        validate(wrapper, true);
        expect(wrapper.find('.domain-annotation-item').text()).toBe(TEST_FIELD.principalConceptCode);
        expect(wrapper.find('.fa-remove')).toHaveLength(1);
        expect(getSelectButton(wrapper).prop('disabled')).toBeFalsy();
        wrapper.unmount();
    });

    test('isFieldLocked and select button props', () => {
        const field = TEST_FIELD.merge({ lockType: DOMAIN_FIELD_FULLY_LOCKED }) as DomainField;
        const wrapper = mount(<OntologyConceptAnnotation {...DEFAULT_PROPS} field={field} />);
        validate(wrapper, true, false);
        expect(wrapper.find('.fa-remove')).toHaveLength(0);
        expect(getSelectButton(wrapper).prop('disabled')).toBeTruthy();
        expect(getSelectButton(wrapper).prop('id')).toBe(DEFAULT_PROPS.id);
        expect(getSelectButton(wrapper).prop('name')).toBe('domainpropertiesrow-principalConceptCode');
        wrapper.unmount();
    });

    test('showSelectModal', () => {
        const wrapper = mount(<OntologyConceptAnnotation {...DEFAULT_PROPS} field={TEST_FIELD} />);
        validate(wrapper, true);
        expect(wrapper.find(OntologyBrowserModal)).toHaveLength(0);
        getSelectButton(wrapper).simulate('click');
        expect(wrapper.find(OntologyBrowserModal)).toHaveLength(1);
        expect(wrapper.find(OntologyBrowserModal).prop('title')).toBe('Select Concept');
        expect(wrapper.find(OntologyBrowserModal).prop('initOntologyId')).toBe(TEST_FIELD.sourceOntology);
        wrapper.unmount();
    });
});
