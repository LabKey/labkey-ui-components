import React from 'react';
import renderer from 'react-test-renderer';

import { HelpLink, getHelpLink, HELP_LINK_REFERRER, JavaDocsLink } from './helpLinks';
import { mount } from 'enzyme';

const HELP_LINK_BASE_URL = 'https://www.labkey.org/Documentation/wiki-page.view?';

describe('HelpLink', () => {
    test('default props', () => {
        const wrapper = mount(<HelpLink topic="TEST_TOPIC">default props text</HelpLink>);
        expect(wrapper.find("a").prop("href")).toBe(HELP_LINK_BASE_URL + 'referrer=inPage&name=TEST_TOPIC');
    });

    test('custom props', () => {
        const wrapper = mount(
            <HelpLink topic="TEST_TOPIC" className="test-class-name" referrer={HELP_LINK_REFERRER.ERROR_PAGE}>
                custom props
            </HelpLink>
        );
        const link = wrapper.find('a');
        expect(link.prop("href")).toBe(HELP_LINK_BASE_URL + 'referrer=errorPage&name=TEST_TOPIC');
        expect(link.prop("className")).toBe('test-class-name');
        expect(wrapper.text()).toBe("custom props");
    });
});

describe('getHelpLink', () => {
    test('default props', () => {
        expect(getHelpLink('TEST_TOPIC')).toBe(HELP_LINK_BASE_URL + 'referrer=inPage&name=TEST_TOPIC');
    });

    test('with referrer', () => {
        expect(getHelpLink('TEST_TOPIC', HELP_LINK_REFERRER.ERROR_PAGE)).toBe(
            HELP_LINK_BASE_URL + 'referrer=errorPage&name=TEST_TOPIC'
        );
    });
});

describe('JavaDocsLink', () => {
    test('default props', () => {
        LABKEY.jdkJavaDocLinkPrefix = 'https://docs.oracle.com/en/java/javase/16/docs/api/java.base/';
        const component = <JavaDocsLink urlSuffix="test/SomeClass.html">Some Class</JavaDocsLink>;
        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();
    });
});
