import React from 'react';
import { mount, ReactWrapper, shallow } from 'enzyme';

import { OntologyBrowserModal } from './OntologyBrowserModal';
import { OntologyBrowserPanel } from './OntologyBrowserPanel';

const DEFAULT_PROPS = {
    title: 'Test title',
    onCancel: jest.fn(),
    onApply: jest.fn(),
};

describe('OntologyBrowserModal', () => {
    function validate(wrapper: ReactWrapper): void {
        expect(wrapper.find('Modal').prop('bsSize')).toBe('lg');
        expect(wrapper.find('Modal').prop('onCancel')).toBe(DEFAULT_PROPS.onCancel);
        expect(wrapper.find('.modal-title').text()).toBe(DEFAULT_PROPS.title);
        expect(wrapper.find(OntologyBrowserPanel)).toHaveLength(1);
        expect(wrapper.find('button')).toHaveLength(3);
    }

    test('default props', () => {
        const wrapper = mount(<OntologyBrowserModal {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('OntologyBrowserPanel props', () => {
        const wrapper = shallow(<OntologyBrowserModal {...DEFAULT_PROPS} initOntologyId="testOntId" />);
        const panel = wrapper.find(OntologyBrowserPanel);
        expect(panel.prop('asPanel')).toBe(false);
        expect(panel.prop('initOntologyId')).toBe('testOntId');
        wrapper.unmount();
    });
});
