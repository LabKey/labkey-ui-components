import React from 'react';
import { mount } from 'enzyme';

import { TEST_USER_APP_ADMIN, TEST_USER_FOLDER_ADMIN, TEST_USER_READER } from '../../userFixtures';
import { NEW_SAMPLE_TYPE_HREF, NEW_SAMPLES_HREF } from '../../app/constants';

import { mountWithAppServerContext } from '../../enzymeTestHelpers';
import { Container } from '../base/models/Container';

import { SampleEmptyAlert, SampleTypeEmptyAlert } from './SampleEmptyAlert';

const EMPTY_ALERT = '.empty-alert';

describe('SampleEmptyAlert', () => {
    test('with permissions', () => {
        const wrapper = mountWithAppServerContext(<SampleEmptyAlert user={TEST_USER_FOLDER_ADMIN} />);

        // Expect default message
        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toContain(
            'No samples have been created. Click here to create samples.'
        );

        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(NEW_SAMPLES_HREF.toHref());
    });
    test('without permissions', () => {
        const expectedMessage = 'I am just a reader';
        const wrapper = mountWithAppServerContext(
            <SampleEmptyAlert message={expectedMessage} user={TEST_USER_READER} />
        );

        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toEqual(expectedMessage);
    });
});

describe('SampleTypeEmptyAlert', () => {
    const topFolderContext = {
        container: new Container({ type: 'project', path: 'project' }),
        moduleContext: { query: { isProductProjectsEnabled: false } },
    };

    const homeProjectContext = {
        container: new Container({ type: 'project', path: 'project' }),
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
            homeProjectContext
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
            homeProjectContext
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
