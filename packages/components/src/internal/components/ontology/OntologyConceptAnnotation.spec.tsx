import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { DomainField, DomainFieldLabel, LabelHelpTip } from '../../..';

import { DOMAIN_FIELD_FULLY_LOCKED } from '../domainproperties/constants';

import { ConceptModel } from './models';
import { OntologyConceptAnnotationImpl } from './OntologyConceptAnnotation';
import { OntologyBrowserModal } from './OntologyBrowserModal';
import { ConceptOverviewTooltip } from './ConceptOverviewPanel';

const DEFAULT_PROPS = {
    id: 'testId',
    field: new DomainField(),
    onChange: jest.fn,
    successBsStyle: 'success',
    error: undefined,
    concept: undefined,
};

const TEST_FIELD = new DomainField({ principalConceptCode: 'code:123',  });
const TEST_CONCEPT = new ConceptModel({ code: 'a', label: 'b', ontology: 'ontSource' });

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

    test('no concept', () => {
        const wrapper = mount(<OntologyConceptAnnotationImpl {...DEFAULT_PROPS} />);
        validate(wrapper, false);
        expect(wrapper.find('.domain-text-label').text()).toBe('None Set');
        wrapper.unmount();
    });

    test('principalConceptCode, no concept', () => {
        const wrapper = mount(<OntologyConceptAnnotationImpl {...DEFAULT_PROPS} field={TEST_FIELD} />);
        validate(wrapper, true);
        expect(wrapper.find('.domain-annotation-item').text()).toBe(TEST_FIELD.principalConceptCode);
        expect(wrapper.find('.fa-remove')).toHaveLength(1);
        expect(getSelectButton(wrapper).prop('disabled')).toBeFalsy();
        wrapper.unmount();
    });

    test('principalConceptCode, with concept', () => {
        const wrapper = mount(
            <OntologyConceptAnnotationImpl {...DEFAULT_PROPS} field={TEST_FIELD} concept={TEST_CONCEPT} />
        );
        validate(wrapper, true);
        expect(wrapper.find('.domain-annotation-item').text()).toBe(TEST_CONCEPT.getDisplayLabel());
        expect(wrapper.find('.fa-remove')).toHaveLength(1);
        expect(getSelectButton(wrapper).prop('disabled')).toBeFalsy();
        wrapper.unmount();
    });

    test('isFieldLocked and select button props', () => {
        const field = TEST_FIELD.merge({ lockType: DOMAIN_FIELD_FULLY_LOCKED }) as DomainField;
        const wrapper = mount(<OntologyConceptAnnotationImpl {...DEFAULT_PROPS} field={field} />);
        validate(wrapper, true, false);
        expect(wrapper.find('.fa-remove')).toHaveLength(0);
        expect(getSelectButton(wrapper).prop('disabled')).toBeTruthy();
        expect(getSelectButton(wrapper).prop('id')).toBe(DEFAULT_PROPS.id);
        expect(getSelectButton(wrapper).prop('name')).toBe('domainpropertiesrow-principalConceptCode');
        wrapper.unmount();
    });

    test('showSelectModal', () => {
        const wrapper = mount(<OntologyConceptAnnotationImpl {...DEFAULT_PROPS} field={TEST_FIELD} />);
        validate(wrapper, true);
        expect(wrapper.find(OntologyBrowserModal)).toHaveLength(0);
        getSelectButton(wrapper).simulate('click');
        expect(wrapper.find(OntologyBrowserModal)).toHaveLength(1);
        expect(wrapper.find(OntologyBrowserModal).prop('title')).toBe('Select Concept');
        expect(wrapper.find(OntologyBrowserModal).prop('initOntologyId')).toBe(TEST_FIELD.sourceOntology);
        expect(wrapper.find(OntologyBrowserModal).prop('successBsStyle')).toBe(DEFAULT_PROPS.successBsStyle);
        wrapper.unmount();
    });
});
