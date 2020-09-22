import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { RemovableButton } from './RemovableButton';

describe('<RemovableButton/>', () => {
    test('default props', () => {
        const component = <RemovableButton id={1} display="Display Text" onRemove={jest.fn()} onClick={jest.fn()} />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom props', () => {
        const component = (
            <RemovableButton
                id={2}
                display="Display Text (Custom)"
                onRemove={jest.fn()}
                onClick={jest.fn()}
                bsStyle="primary"
                added={true}
                disabledMsg="Disabled message"
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('not removable', () => {
        const component = <RemovableButton id={2} display="Display Text (Not Removable)" onClick={jest.fn()} />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with state', () => {
        const wrapper = mount(
            <RemovableButton id={1} display="Display Text" onRemove={jest.fn()} onClick={jest.fn()} />
        );

        // test the removed state, should change some css classes
        expect(wrapper.find('ButtonGroup').prop('className')).toBe('permissions-button-group');
        wrapper.setState({ removed: true });
        expect(wrapper.find('ButtonGroup').prop('className')).toBe(
            'permissions-button-group permissions-button-removed'
        );

        wrapper.unmount();
    });
});
