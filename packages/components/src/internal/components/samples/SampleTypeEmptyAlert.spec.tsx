import React from 'react';

import { TEST_USER_APP_ADMIN, TEST_USER_READER } from '../../userFixtures';
import { NEW_SAMPLE_TYPE_HREF } from '../../app/constants';

import { mountWithAppServerContext } from '../../test/enzymeTestHelpers';
import { Container } from '../base/models/Container';

import { SampleTypeEmptyAlert } from './SampleTypeEmptyAlert';

const EMPTY_ALERT = '.empty-alert';

describe('SampleTypeEmptyAlert', () => {
    const topFolderContext = {
        container: new Container({ type: 'project', path: 'project' }),
        moduleContext: { query: { isProductProjectsEnabled: false } },
    };

    const adminHomeProjectContext = {
        container: new Container({ type: 'project', path: 'project' }),
        user: TEST_USER_APP_ADMIN,
        moduleContext: { query: { isProductProjectsEnabled: true } },
    };

    const childProjectContext = {
        container: new Container({ type: 'folder', path: 'project/sub1' }),
        moduleContext: { query: { isProductProjectsEnabled: true } },
    };

    const childFolderNonProjectContext = {
        container: new Container({ type: 'folder', path: 'project/sub1' }),
        moduleContext: { query: { isProductProjectsEnabled: false } },
    };

    test('with permissions', () => {
        const wrapper = mountWithAppServerContext(
            <SampleTypeEmptyAlert user={TEST_USER_APP_ADMIN} />,
            {},
            adminHomeProjectContext
        );

        // Expect default message
        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toContain('No sample types have been created');

        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(NEW_SAMPLE_TYPE_HREF.toHref());
    });
    test('without permissions', () => {
        const expectedMessage = 'I am just a reader';
        const wrapper = mountWithAppServerContext(
            <SampleTypeEmptyAlert message={expectedMessage} user={TEST_USER_READER} />,
            {},
            adminHomeProjectContext
        );

        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toEqual(expectedMessage);
    });
    test('top level folder context', () => {
        const wrapper = mountWithAppServerContext(
            <SampleTypeEmptyAlert user={TEST_USER_APP_ADMIN} />,
            {},
            topFolderContext
        );

        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(NEW_SAMPLE_TYPE_HREF.toHref());
    });
    test('child project folder context', () => {
        const wrapper = mountWithAppServerContext(
            <SampleTypeEmptyAlert user={TEST_USER_APP_ADMIN} />,
            {},
            childProjectContext
        );

        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toEqual('No sample types have been created.');
        // Expect no link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).length).toEqual(0);
    });
    test('child folder but Projects feature not enabled for folder', () => {
        const wrapper = mountWithAppServerContext(
            <SampleTypeEmptyAlert user={TEST_USER_APP_ADMIN} />,
            {},
            childFolderNonProjectContext
        );

        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(NEW_SAMPLE_TYPE_HREF.toHref());
    });
});
