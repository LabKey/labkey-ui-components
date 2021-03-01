import React from 'react';
import { NavItem, Tab } from 'react-bootstrap';
import { mount, ReactWrapper } from 'enzyme';

import { ConceptInformationTabs, ConceptInfoTabs } from './ConceptInformationTabs';
import { ConceptOverviewPanelImpl } from './ConceptOverviewPanel';
import { ConceptModel } from './models';

const DEFAULT_PROPS = {
    concept: undefined,
};

describe('ConceptInformationTabs', () => {
    function validate(wrapper: ReactWrapper) {
        expect(wrapper.find(Tab.Container)).toHaveLength(1);
        expect(wrapper.find(NavItem)).toHaveLength(2);
        expect(wrapper.find('.ontology-concept-overview-container')).toHaveLength(2);
        expect(wrapper.find(ConceptOverviewPanelImpl)).toHaveLength(1);
        expect(wrapper.find('.ontology-concept-pathinfo-container')).toHaveLength(2);
        expect(wrapper.find('.placeholder')).toHaveLength(1);
    }

    test('no concept', () => {
        const wrapper = mount(<ConceptInformationTabs {...DEFAULT_PROPS} />);
        validate(wrapper);
        expect(wrapper.find(ConceptOverviewPanelImpl).prop('concept')).toBe(undefined);
        wrapper.unmount();
    });

    test('with concept', () => {
        const concept = new ConceptModel({ code: 'a', label: 'b' });
        const wrapper = mount(<ConceptInformationTabs {...DEFAULT_PROPS} concept={concept} />);
        validate(wrapper);
        expect(wrapper.find(ConceptOverviewPanelImpl).prop('concept')).toBe(concept);
        wrapper.unmount();
    });

    test('activeTab and defaultActiveKey', () => {
        const wrapper = mount(<ConceptInformationTabs {...DEFAULT_PROPS} />);
        validate(wrapper);
        expect(wrapper.find(Tab.Container).prop('defaultActiveKey')).toBe(ConceptInfoTabs.CONCEPT_OVERVIEW_TAB);
        expect(wrapper.find(Tab.Container).prop('activeKey')).toBe(ConceptInfoTabs.CONCEPT_OVERVIEW_TAB);
        wrapper.unmount();
    });
});
