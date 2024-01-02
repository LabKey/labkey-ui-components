import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { DomainField } from '../domainproperties/models';

import { DOMAIN_FIELD_FULLY_LOCKED } from '../domainproperties/constants';

import { OntologyConceptSelectButton } from './OntologyConceptSelectButton';
import { ConceptOverviewTooltip } from './ConceptOverviewPanel';
import { OntologyBrowserModal } from './OntologyBrowserModal';

const DEFAULT_PROPS = {
    id: 'test-id',
    title: 'Button Title',
    field: new DomainField({}),
    valueProp: 'principalConceptCode',
    valueIsPath: false,
    onChange: jest.fn,
};

describe('OntologyConceptSelectButton', () => {
    function validate(wrapper: ReactWrapper, value = 'None Set', isFieldLocked = false, showModal = false): void {
        const hasValue = value !== 'None Set';

        expect(wrapper.find('.domain-annotation-table')).toHaveLength(1);
        expect(wrapper.find(ConceptOverviewTooltip)).toHaveLength(1);
        expect(wrapper.find(OntologyBrowserModal)).toHaveLength(showModal ? 1 : 0);

        expect(wrapper.find('button')).toHaveLength(showModal ? 4 : 1);
        expect(wrapper.find('button').first().prop('disabled')).toBe(isFieldLocked);
        expect(wrapper.find('button').first().text()).toBe('Button Title');

        expect(wrapper.find('.fa-remove')).toHaveLength(hasValue && !isFieldLocked ? 1 : 0);
        expect(wrapper.find('.domain-text-label')).toHaveLength(!hasValue || isFieldLocked ? 1 : 0);
        expect(wrapper.find('.domain-annotation-item')).toHaveLength(hasValue ? 1 : 0);
        if (hasValue) {
            expect(wrapper.find('.domain-annotation-item').text()).toBe(value);
            const itemOnClick = wrapper.find('.domain-annotation-item').prop('onClick');
            if (!isFieldLocked) expect(itemOnClick).toBeDefined();
            if (isFieldLocked) expect(itemOnClick).toBeUndefined();
        } else {
            expect(wrapper.find('.domain-text-label').text()).toBe(value);
        }
    }

    test('no value set', () => {
        const wrapper = mount(<OntologyConceptSelectButton {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('showSelectModal', () => {
        const wrapper = mount(<OntologyConceptSelectButton {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.find('button').simulate('click');
        validate(wrapper, 'None Set', false, true);
        wrapper.unmount();
    });

    test('with value set', () => {
        const wrapper = mount(
            <OntologyConceptSelectButton
                {...DEFAULT_PROPS}
                field={new DomainField({ principalConceptCode: 'TEST VALUE' })}
            />
        );
        validate(wrapper, 'TEST VALUE');
        wrapper.unmount();
    });

    test('isFieldLocked', () => {
        const wrapper = mount(
            <OntologyConceptSelectButton
                {...DEFAULT_PROPS}
                field={
                    new DomainField({
                        principalConceptCode: 'TEST VALUE',
                        lockType: DOMAIN_FIELD_FULLY_LOCKED,
                    })
                }
            />
        );
        validate(wrapper, 'TEST VALUE', true);
        wrapper.unmount();
    });

    test('OntologyBrowserModal props', () => {
        const wrapper = mount(
            <OntologyConceptSelectButton
                {...DEFAULT_PROPS}
                field={
                    new DomainField({
                        sourceOntology: 'Test Source',
                    })
                }
            />
        );
        wrapper.find('button').simulate('click');
        validate(wrapper, 'None Set', false, true);
        const modal = wrapper.find(OntologyBrowserModal);
        expect(modal.prop('title')).toBe('Button Title');
        expect(modal.prop('initOntologyId')).toBe(undefined);
        wrapper.unmount();
    });

    test('useFieldSourceOntology', () => {
        const wrapper = mount(
            <OntologyConceptSelectButton
                {...DEFAULT_PROPS}
                field={
                    new DomainField({
                        sourceOntology: 'Test Source',
                    })
                }
                useFieldSourceOntology
            />
        );
        wrapper.find('button').simulate('click');
        validate(wrapper, 'None Set', false, true);
        const modal = wrapper.find(OntologyBrowserModal);
        expect(modal.prop('initOntologyId')).toBe('Test Source');
        wrapper.unmount();
    });
});
