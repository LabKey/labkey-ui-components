import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Alert, LoadingSpinner, SelectInput } from '../../..';

import { OntologySelectionPanelImpl } from './OntologySelectionPanel';
import { PathModel } from './models';

const DEFAULT_PROPS = {
    error: undefined,
    ontologies: undefined,
    asPanel: false,
    onOntologySelection: jest.fn,
};

describe('OntologySelectionPanel', () => {
    function validate(wrapper: ReactWrapper, ontCount?: number, errorTxt?: string, asPanel = false): void {
        expect(wrapper.find(Alert).first().text()).toBe(errorTxt ?? '');
        expect(wrapper.find(LoadingSpinner)).toHaveLength(ontCount === undefined ? 1 : 0);
        expect(wrapper.find('.alert-warning')).toHaveLength(ontCount !== undefined && ontCount === 0 ? 1 : 0);
        expect(wrapper.find(SelectInput)).toHaveLength(ontCount !== undefined ? 1 : 0);
        expect(wrapper.find('.ontology-browser-container')).toHaveLength(asPanel ? 1 : 0);
    }

    test('loading', () => {
        const wrapper = mount(<OntologySelectionPanelImpl {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('no ontologies, non root admin', () => {
        const ontologies = [];
        const wrapper = mount(<OntologySelectionPanelImpl {...DEFAULT_PROPS} ontologies={ontologies} />);
        validate(wrapper, 0);
        expect(wrapper.find('.alert-warning').text()).toBe('No ontologies have been loaded for this server.');
        expect(wrapper.find(SelectInput).prop('options')).toBe(ontologies);
        wrapper.unmount();
    });

    test('no ontologies, as root admin', () => {
        LABKEY.user.isRootAdmin = true;
        const ontologies = [];
        const wrapper = mount(<OntologySelectionPanelImpl {...DEFAULT_PROPS} ontologies={ontologies} />);
        validate(wrapper, 0);
        expect(wrapper.find('.alert-warning').text()).toContain('Click here to get started.');
        wrapper.unmount();
    });

    test('with ontologies', () => {
        const ontologies = [new PathModel()];
        const wrapper = mount(<OntologySelectionPanelImpl {...DEFAULT_PROPS} ontologies={ontologies} />);
        validate(wrapper, ontologies.length);
        expect(wrapper.find(SelectInput).prop('options')).toBe(ontologies);
        wrapper.unmount();
    });

    test('asPanel', () => {
        const wrapper = mount(<OntologySelectionPanelImpl {...DEFAULT_PROPS} ontologies={[]} asPanel={true} />);
        validate(wrapper, 0, undefined, true);
        expect(wrapper.find('.panel-body')).toHaveLength(1);
        wrapper.unmount();
    });

    test('error', () => {
        const wrapper = mount(<OntologySelectionPanelImpl {...DEFAULT_PROPS} ontologies={[]} error={'test error'} />);
        validate(wrapper, 0, 'test error');
        wrapper.unmount();
    });
});
