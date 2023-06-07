import React from 'react';
import renderer from 'react-test-renderer';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../internal/userFixtures';
import { mountWithServerContext } from '../../internal/test/enzymeTestHelpers';

import { TemplateDownloadButton } from './TemplateDownloadButton';

describe('TemplateDownloadButton', () => {
    test('no onclick or templateUrl', () => {
        const component = <TemplateDownloadButton />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toBeNull();
    });

    test('no onclick, empty templateUrl', () => {
        const component = <TemplateDownloadButton templateUrl="" />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toBeNull();
    });

    test('reader', () => {
        const component = <TemplateDownloadButton templateUrl="" user={TEST_USER_READER} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toBeNull();
    });

    test('editor', () => {
        const wrapper = mountWithServerContext(
            <TemplateDownloadButton templateUrl="testUrl" user={TEST_USER_EDITOR} />,
            {}
        );
        expect(wrapper.text()).toBe(' Template');
        expect(wrapper.containsMatchingElement(<span className="fa fa-download" />)).toBeTruthy();
        wrapper.unmount();
    });

    test('editor, with custom properties', () => {
        const wrapper = mountWithServerContext(
            <TemplateDownloadButton
                onClick={jest.fn}
                text="Test Text"
                className="custom-styling"
                user={TEST_USER_EDITOR}
            />,
            {}
        );
        expect(wrapper.text()).toBe(' Test Text');
        expect(wrapper.find('.custom-styling').exists()).toBeTruthy();
        wrapper.unmount();
    });
});
