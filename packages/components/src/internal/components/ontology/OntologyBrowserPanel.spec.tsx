import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Alert } from '../base/Alert';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { OntologyBrowserPanel, OntologyBrowserPanelImpl } from './OntologyBrowserPanel';
import { OntologySelectionPanel } from './OntologySelectionPanel';
import { OntologyTreeSearchContainer } from './OntologyTreeSearchContainer';
import { OntologyTreePanel } from './OntologyTreePanel';
import { ConceptInformationTabs } from './ConceptInformationTabs';
import { ConceptModel, OntologyModel } from './models';

describe('OntologyBrowserPanel', () => {
    function validate(wrapper: ReactWrapper, hasOntologyId: boolean): void {
        expect(wrapper.find(Alert)).toHaveLength(hasOntologyId ? 1 : 2);
        expect(wrapper.find(Alert).first().text()).toBe('');
        expect(wrapper.find(OntologySelectionPanel)).toHaveLength(!hasOntologyId ? 1 : 0);
        expect(wrapper.find(OntologyBrowserPanelImpl)).toHaveLength(hasOntologyId ? 1 : 0);
    }

    test('no initOntologyId', () => {
        const wrapper = mount(<OntologyBrowserPanel />);
        validate(wrapper, false);
        expect(wrapper.find(OntologySelectionPanel).prop('asPanel')).toBeTruthy();
        wrapper.unmount();
    });

    test('with initOntologyId', () => {
        const wrapper = mount(<OntologyBrowserPanel initOntologyId="testOntId" />);
        validate(wrapper, true);
        expect(wrapper.find(OntologyBrowserPanelImpl).prop('asPanel')).toBeTruthy();
        wrapper.unmount();
    });

    test('asPanel false', () => {
        const wrapper = mount(<OntologyBrowserPanel asPanel={false} />);
        validate(wrapper, false);
        expect(wrapper.find(OntologySelectionPanel).prop('asPanel')).toBeFalsy();
        wrapper.unmount();
    });
});

const DEFAULT_PROPS = {
    ontology: undefined,
    selectedConcept: undefined,
    setSelectedConcept: jest.fn,
    setSelectedPath: jest.fn,
    asPanel: false,
};

const TEST_ONTOLOGY = new OntologyModel({
    abbreviation: 't',
    name: 'test name',
    conceptCount: 100,
    description: 'test desc',
});
const TEST_CONCEPT = new ConceptModel({ code: 'a', label: 'b' });

describe('OntologyBrowserPanelImpl', () => {
    function validate(wrapper: ReactWrapper, loading: boolean, asPanel = false): void {
        expect(wrapper.find('.ontology-browser-container')).toHaveLength(!loading ? 1 : 0);
        expect(wrapper.find('.left-panel')).toHaveLength(!loading ? 1 : 0);
        expect(wrapper.find('.right-panel')).toHaveLength(!loading ? 1 : 0);
        expect(wrapper.find(OntologyTreeSearchContainer)).toHaveLength(!loading ? 1 : 0);
        expect(wrapper.find(OntologyTreePanel)).toHaveLength(!loading ? 1 : 0);
        expect(wrapper.find(ConceptInformationTabs)).toHaveLength(!loading ? 1 : 0);
        expect(wrapper.find('.panel-body')).toHaveLength(asPanel ? 1 : 0);
        expect(wrapper.find(LabelHelpTip)).toHaveLength(asPanel ? 1 : 0);
    }

    test('loading', () => {
        const wrapper = mount(<OntologyBrowserPanelImpl {...DEFAULT_PROPS} />);
        validate(wrapper, true);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
        wrapper.unmount();
    });

    test('ontology', () => {
        const wrapper = mount(<OntologyBrowserPanelImpl {...DEFAULT_PROPS} ontology={TEST_ONTOLOGY} />);
        validate(wrapper, false);
        expect(wrapper.find(OntologyTreeSearchContainer).prop('ontology')).toBe(TEST_ONTOLOGY);
        expect(wrapper.find(OntologyTreePanel).prop('root').label).toBe(TEST_ONTOLOGY.name);
        wrapper.unmount();
    });

    test('selectedConcept', () => {
        const wrapper = mount(
            <OntologyBrowserPanelImpl {...DEFAULT_PROPS} ontology={TEST_ONTOLOGY} selectedConcept={TEST_CONCEPT} />
        );
        validate(wrapper, false);
        expect(wrapper.find(ConceptInformationTabs).prop('concept')).toBe(TEST_CONCEPT);
        wrapper.unmount();
    });

    test('asPanel', () => {
        const wrapper = mount(<OntologyBrowserPanelImpl {...DEFAULT_PROPS} ontology={TEST_ONTOLOGY} asPanel={true} />);
        validate(wrapper, false, true);
        expect(wrapper.find('.panel-heading').text()).toContain('Browse test name (t)');
        wrapper.unmount();
    });
});
