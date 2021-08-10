import React from 'react';
import renderer from 'react-test-renderer';

import { HelpLink, getHelpLink } from './helpLinks';

const HELP_LINK_BASE_URL = 'https://www.labkey.org/Documentation/wiki-page.view?';

describe('HelpLink', () => {
    test('default props', () => {
        const component = <HelpLink topic="TEST_TOPIC">default props text</HelpLink>;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom props', () => {
        const component = (
            <HelpLink topic="TEST_TOPIC" className="test-class-name" referrer="TEST_REFERRER">
                custom props
            </HelpLink>
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});

describe('getHelpLink', () => {
    test('default props', () => {
        expect(getHelpLink('TEST_TOPIC')).toBe(HELP_LINK_BASE_URL + 'name=TEST_TOPIC&referrer=inPage');
    });

    test('with referrer', () => {
        expect(getHelpLink('TEST_TOPIC', 'TEST_REFERRER')).toBe(
            HELP_LINK_BASE_URL + 'name=TEST_TOPIC&referrer=TEST_REFERRER'
        );
    });
});
