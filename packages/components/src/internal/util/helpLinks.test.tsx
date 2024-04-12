import React from 'react';
import { render } from '@testing-library/react';

import { renderWithAppContext } from '../test/reactTestLibraryHelpers';

import { getHelpLink, HELP_LINK_REFERRER, HelpLink, JavaDocsLink } from './helpLinks';

const HELP_LINK_BASE_URL = 'https://www.labkey.org/Documentation/wiki-page.view?';

beforeEach(() => {
    LABKEY.helpLinkPrefix = HELP_LINK_BASE_URL + 'name=';
});

describe('HelpLink', () => {
    test('default props', () => {
        renderWithAppContext(<HelpLink topic="TEST_TOPIC">default props text</HelpLink>);
        expect(document.querySelector('a').getAttribute('href')).toBe(
            HELP_LINK_BASE_URL + 'referrer=inPage&name=TEST_TOPIC'
        );
    });

    test('custom props', () => {
        renderWithAppContext(
            <HelpLink topic="TEST_TOPIC" className="test-class-name" referrer={HELP_LINK_REFERRER.ERROR_PAGE}>
                custom props
            </HelpLink>
        );
        const link = document.querySelector('a');
        expect(link.getAttribute('href')).toBe(HELP_LINK_BASE_URL + 'referrer=errorPage&name=TEST_TOPIC');
        expect(link.getAttribute('class')).toBe('test-class-name');
        expect(link.innerHTML).toBe('custom props');
    });

    test('helpLinkPrefix and useDefaultUrl false', () => {
        const prefix = 'https://www.labkey.org/LKSM-page.view?';
        LABKEY.helpLinkPrefix = prefix + 'name=';

        renderWithAppContext(
            <HelpLink topic="TEST_TOPIC" useDefaultUrl={false}>
                more info
            </HelpLink>
        );
        expect(document.querySelector('a').getAttribute('href')).toBe(prefix + 'referrer=inPage&name=TEST_TOPIC');
    });

    test('helpLinkPrefix and useDefaultUrl', () => {
        const prefix = 'https://www.labkey.org/LKSM-page.view?';
        LABKEY.helpLinkPrefix = prefix + 'name=';

        renderWithAppContext(
            <HelpLink topic="TEST_TOPIC" useDefaultUrl>
                more info
            </HelpLink>
        );
        expect(document.querySelector('a').getAttribute('href')).toBe(
            HELP_LINK_BASE_URL + 'referrer=inPage&name=TEST_TOPIC'
        );
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

    test('helpLinkPrefix and useDefaultUrl', () => {
        const prefix = 'https://www.labkey.org/LKSM-page.view?';
        LABKEY.helpLinkPrefix = prefix + 'name=';

        expect(getHelpLink('TEST_TOPIC')).toBe(prefix + 'referrer=inPage&name=TEST_TOPIC');
        expect(getHelpLink('TEST_TOPIC', HELP_LINK_REFERRER.IN_PAGE, true)).toBe(
            HELP_LINK_BASE_URL + 'referrer=inPage&name=TEST_TOPIC'
        );
    });
});

describe('JavaDocsLink', () => {
    test('default props', () => {
        const prefix = 'https://docs.oracle.com/en/java/javase/16/docs/api/java.base/';
        const suffix = 'test/SomeClass.html';
        LABKEY.jdkJavaDocLinkPrefix = prefix;
        render(<JavaDocsLink urlSuffix={suffix}>Some Class</JavaDocsLink>);
        const link = document.querySelector('a');
        expect(link.getAttribute('href')).toBe(prefix + suffix);
        expect(link.innerHTML).toBe('Some Class');
    });
});
