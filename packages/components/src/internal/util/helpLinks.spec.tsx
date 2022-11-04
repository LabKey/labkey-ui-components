import React from 'react';
import renderer from 'react-test-renderer';

import { HelpLink, getHelpLink, HELP_LINK_REFERRER, JavaDocsLink } from './helpLinks';

const HELP_LINK_BASE_URL = 'https://www.labkey.org/Documentation/wiki-page.view?';

describe('HelpLink', () => {
    test('default props', () => {
        const component = <HelpLink topic="TEST_TOPIC">default props text</HelpLink>;
        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();
    });

    test('custom props', () => {
        const component = (
            <HelpLink topic="TEST_TOPIC" className="test-class-name" referrer={HELP_LINK_REFERRER.ERROR_PAGE}>
                custom props
            </HelpLink>
        );
        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();
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
