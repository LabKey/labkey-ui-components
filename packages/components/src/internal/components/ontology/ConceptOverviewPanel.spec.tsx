import React from 'react';
import { Modal } from 'react-bootstrap';
import { mount, ReactWrapper } from 'enzyme';

import { Alert } from '../../..';

import { ConceptOverviewModal, ConceptOverviewPanelImpl, OntologyConceptOverviewPanel } from './ConceptOverviewPanel';
import { ConceptModel } from './models';

const TEST_CONCEPT = new ConceptModel({ code: 'a', label: 'b', description: 'c' });

describe('OntologyConceptOverviewPanel', () => {
    test('without code prop', () => {
        const wrapper = mount(<OntologyConceptOverviewPanel code={undefined} />);
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find(Alert).text()).toBe('');
        expect(wrapper.find(ConceptOverviewPanelImpl)).toHaveLength(0);
        wrapper.unmount();
    });
});

describe('ConceptOverviewPanelImpl', () => {
    function validate(wrapper: ReactWrapper, isEmpty: boolean, divCount = 1): void {
        expect(wrapper.find('.none-selected')).toHaveLength(isEmpty ? 1 : 0);
        expect(wrapper.find('div')).toHaveLength(divCount);
    }

    test('no concept', () => {
        const wrapper = mount(<ConceptOverviewPanelImpl concept={undefined} />);
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('with concept', () => {
        const wrapper = mount(<ConceptOverviewPanelImpl concept={TEST_CONCEPT} />);
        validate(wrapper, false, 3);
        expect(wrapper.find('.title').text()).toBe(TEST_CONCEPT.label);
        expect(wrapper.find('.code').text()).toBe(TEST_CONCEPT.code);
        expect(wrapper.find('.description-title').text()).toBe('Description');
        expect(wrapper.find('.description-text').text()).toBe(TEST_CONCEPT.description);
        wrapper.unmount();
    });
});

describe('ConceptOverviewModal', () => {
    const onCloseFn = jest.fn;

    function validate(wrapper: ReactWrapper, errorTxt?: string): void {
        expect(wrapper.find(Modal)).toHaveLength(1);
        expect(wrapper.find(Modal).prop('onHide')).toBe(onCloseFn);
        expect(wrapper.find(Modal.Header).prop('closeButton')).toBe(true);
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find(Alert).text()).toBe(errorTxt ?? '');
        expect(wrapper.find('.ontology-concept-overview-container')).toHaveLength(!errorTxt ? 1 : 0);
        expect(wrapper.find(ConceptOverviewPanelImpl)).toHaveLength(!errorTxt ? 1 : 0);
    }

    test('no concept', () => {
        const wrapper = mount(<ConceptOverviewModal concept={undefined} onClose={onCloseFn} />);
        validate(wrapper);
        expect(wrapper.find(ConceptOverviewPanelImpl).prop('concept')).toBe(undefined);
        wrapper.unmount();
    });

    test('with concept', () => {
        const wrapper = mount(<ConceptOverviewModal concept={TEST_CONCEPT} onClose={onCloseFn} />);
        validate(wrapper);
        expect(wrapper.find(ConceptOverviewPanelImpl).prop('concept')).toBe(TEST_CONCEPT);
        wrapper.unmount();
    });

    test('error', () => {
        const wrapper = mount(<ConceptOverviewModal error="test error" concept={TEST_CONCEPT} onClose={onCloseFn} />);
        validate(wrapper, 'test error');
        wrapper.unmount();
    });
});
