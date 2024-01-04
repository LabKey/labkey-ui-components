import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Alert } from '../base/Alert';

import { LabelHelpTip } from '../base/LabelHelpTip';

import {
    ConceptOverviewTooltip,
    ConceptOverviewPanelImpl,
    ConceptSynonyms,
    OntologyConceptOverviewPanel,
} from './ConceptOverviewPanel';
import { ConceptPathDisplay } from './ConceptPathDisplay';
import { ConceptModel, PathModel } from './models';

const TEST_CONCEPT = new ConceptModel({ code: 'a', label: 'b', description: 'c' });
const TEST_PATH = new PathModel({});

describe('OntologyConceptOverviewPanel', () => {
    test('without code prop', () => {
        const wrapper = mount(<OntologyConceptOverviewPanel code={undefined} />);
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find(Alert).text()).toBe('');
        expect(wrapper.find(ConceptOverviewPanelImpl)).toHaveLength(0);
        wrapper.unmount();
    });
});

describe('ConceptSynonyms', () => {
    test('without synonyms', () => {
        let wrapper = mount(<ConceptSynonyms synonyms={undefined} />);
        expect(wrapper.find('.synonyms-title')).toHaveLength(0);
        expect(wrapper.find('.synonyms-text')).toHaveLength(0);
        wrapper.unmount();

        wrapper = mount(<ConceptSynonyms synonyms={[]} />);
        expect(wrapper.find('.synonyms-title')).toHaveLength(0);
        expect(wrapper.find('.synonyms-text')).toHaveLength(0);
        wrapper.unmount();
    });

    test('with sorted synonyms', () => {
        const wrapper = mount(<ConceptSynonyms synonyms={['a', 'c', 'b']} />);
        expect(wrapper.find('.synonyms-title')).toHaveLength(1);
        expect(wrapper.find('.synonyms-text')).toHaveLength(1);
        expect(wrapper.find('li')).toHaveLength(3);
        expect(wrapper.find('li').at(0).text()).toBe('a');
        expect(wrapper.find('li').at(1).text()).toBe('b');
        expect(wrapper.find('li').at(2).text()).toBe('c');
        wrapper.unmount();
    });
});

describe('ConceptOverviewPanelImpl', () => {
    function validate(
        wrapper: ReactWrapper,
        concept: ConceptModel,
        divCount = 1,
        hasSelectedPath = false,
        showPath = false
    ): void {
        expect(wrapper.find('.none-selected')).toHaveLength(concept === undefined ? 1 : 0);
        expect(wrapper.find('div')).toHaveLength(divCount);
        expect(wrapper.find(ConceptPathDisplay)).toHaveLength(showPath ? 1 : 0);

        expect(wrapper.find('button')).toHaveLength(hasSelectedPath ? 1 : 0);
        if (hasSelectedPath) {
            expect(wrapper.find('button').text()).toBe(showPath ? 'Hide Path' : 'Show Path');
        }

        if (concept) {
            expect(wrapper.find('.title').first().text()).toBe(concept.label);
            expect(wrapper.find('.code').first().text()).toBe(concept.code);
            expect(wrapper.find('.description-title').text()).toBe('Description');
            expect(wrapper.find('.description-text').text()).toBe(concept.description);
        }
    }

    test('no concept', () => {
        const wrapper = mount(<ConceptOverviewPanelImpl concept={undefined} />);
        validate(wrapper, undefined);
        wrapper.unmount();
    });

    test('with concept', () => {
        const wrapper = mount(<ConceptOverviewPanelImpl concept={TEST_CONCEPT} />);
        validate(wrapper, TEST_CONCEPT, 3);
        wrapper.unmount();
    });

    test('with selected path, not shown', () => {
        const wrapper = mount(<ConceptOverviewPanelImpl concept={TEST_CONCEPT} selectedPath={TEST_PATH} />);
        validate(wrapper, TEST_CONCEPT, 4, true);
        wrapper.unmount();
    });

    test('with selected path, shown', () => {
        const wrapper = mount(<ConceptOverviewPanelImpl concept={TEST_CONCEPT} selectedPath={TEST_PATH} />);
        wrapper.find('button').simulate('click');
        validate(wrapper, TEST_CONCEPT, 8, true, true);
        expect(wrapper.find(ConceptPathDisplay).prop('title')).toBe('Current Path');
        expect(wrapper.find(ConceptPathDisplay).prop('path')).toBe(TEST_PATH);
        expect(wrapper.find(ConceptPathDisplay).prop('isSelected')).toBe(true);
        wrapper.unmount();
    });
});

describe('ConceptOverviewToolTip', () => {
    function validate(wrapper: ReactWrapper, concept?: ConceptModel, errorTxt?: string): void {
        expect(wrapper.find(LabelHelpTip)).toHaveLength(errorTxt ? 0 : 1);
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find(Alert).text()).toBe(errorTxt ?? '');
        const infoIcon = wrapper.find('.fa-info-circle');
        expect(infoIcon).toHaveLength(errorTxt ? 0 : !concept ? 0 : 1);

        if (infoIcon.length > 0) {
            infoIcon.simulate('mouseover');
            const over = wrapper.find('.ontology-concept-overview-container');
            expect(over.find('.ontology-concept-overview-container')).toHaveLength(errorTxt ? 0 : 1);
            expect(over.find(ConceptOverviewPanelImpl)).toHaveLength(errorTxt ? 0 : 1);
        }
    }

    test('no concept', () => {
        const wrapper = mount(<ConceptOverviewTooltip concept={undefined} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('with concept', () => {
        const wrapper = mount(<ConceptOverviewTooltip concept={TEST_CONCEPT} />);
        validate(wrapper, TEST_CONCEPT);
        expect(wrapper.find(ConceptOverviewPanelImpl).prop('concept')).toBe(TEST_CONCEPT);
        wrapper.unmount();
    });

    test('with path', () => {
        const wrapper = mount(<ConceptOverviewTooltip concept={TEST_CONCEPT} path={TEST_PATH} />);
        validate(wrapper, TEST_CONCEPT);
        expect(wrapper.find(ConceptOverviewPanelImpl).prop('selectedPath')).toBe(TEST_PATH);
        wrapper.unmount();
    });

    test('error', () => {
        const wrapper = mount(<ConceptOverviewTooltip error="test error" concept={TEST_CONCEPT} />);
        validate(wrapper, TEST_CONCEPT, 'test error');
        wrapper.unmount();
    });
});
