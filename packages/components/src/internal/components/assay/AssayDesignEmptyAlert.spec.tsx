import React from 'react';

import { TEST_USER_ASSAY_DESIGNER, TEST_USER_READER } from '../../userFixtures';
import { NEW_ASSAY_DESIGN_HREF } from '../../app/constants';

import { Container } from '../base/models/Container';
import { mountWithAppServerContext } from '../../enzymeTestHelpers';

import { AssayDesignEmptyAlert } from './AssayDesignEmptyAlert';

const EMPTY_ALERT = '.empty-alert';

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

describe('AssayDesignEmptyAlert', () => {
    test('with permissions', () => {
        const wrapper = mountWithAppServerContext(
            <AssayDesignEmptyAlert user={TEST_USER_ASSAY_DESIGNER} />,
            {},
            homeProjectContext
        );

        // Expect default message
        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toContain('No assays are currently active.');

        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(NEW_ASSAY_DESIGN_HREF.toHref());
    });
    test('without permissions', () => {
        const expectedMessage = 'I am just a reader';
        const wrapper = mountWithAppServerContext(
            <AssayDesignEmptyAlert message={expectedMessage} user={TEST_USER_READER} />,
            {},
            homeProjectContext
        );

        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toEqual(expectedMessage);
    });
    test('top level folder context', () => {
        const wrapper = mountWithAppServerContext(
            <AssayDesignEmptyAlert user={TEST_USER_ASSAY_DESIGNER} />,
            {},
            topFolderContext
        );

        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(NEW_ASSAY_DESIGN_HREF.toHref());
    });
    test('child project folder context', () => {
        const wrapper = mountWithAppServerContext(
            <AssayDesignEmptyAlert user={TEST_USER_ASSAY_DESIGNER} />,
            {},
            childProjectContext
        );

        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toEqual('No assays are currently active.');
        // Expect no link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).length).toEqual(0);
    });
    test('child folder but Projects feature not enabled for folder', () => {
        const wrapper = mountWithAppServerContext(
            <AssayDesignEmptyAlert user={TEST_USER_ASSAY_DESIGNER} />,
            {},
            childFolderNonProjectContext
        );

        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(NEW_ASSAY_DESIGN_HREF.toHref());
    });
});
