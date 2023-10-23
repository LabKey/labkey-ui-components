import React from 'react';

import { TEST_USER_ASSAY_DESIGNER, TEST_USER_READER } from '../../userFixtures';
import { NEW_ASSAY_DESIGN_HREF } from '../../app/constants';
import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';

import { AssayDesignEmptyAlert } from './AssayDesignEmptyAlert';
import {
    TEST_FOLDER_CONTAINER,
    TEST_PROJECT_APP_CONTEXT_ADMIN,
    TEST_PROJECT_APP_CONTEXT_NON_ADMIN,
    TEST_PROJECT_CONTAINER
} from '../../containerFixtures';

const EMPTY_ALERT = '.empty-alert';

const topFolderContext = {
    container: TEST_PROJECT_CONTAINER,
    moduleContext: { query: { isProductProjectsEnabled: false } },
};

const homeProjectContext = {
    container: TEST_PROJECT_CONTAINER,
    moduleContext: { query: { isProductProjectsEnabled: true } },
};

const childProjectContext = {
    container: TEST_FOLDER_CONTAINER,
    moduleContext: { query: { isProductProjectsEnabled: true } },
};

const childFolderNonProjectContext = {
    container: TEST_FOLDER_CONTAINER,
    moduleContext: { query: { isProductProjectsEnabled: false } },
};

describe('AssayDesignEmptyAlert', () => {
    test('with permissions', async () => {
        const wrapper = mountWithAppServerContext(
            <AssayDesignEmptyAlert user={TEST_USER_ASSAY_DESIGNER} />,
            TEST_PROJECT_APP_CONTEXT_ADMIN,
            homeProjectContext
        );
        await waitForLifecycle(wrapper);

        // Expect default message
        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toContain('No assays are currently active.');

        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(NEW_ASSAY_DESIGN_HREF.toHref());
    });
    test('without permissions', async () => {
        const expectedMessage = 'I am just a reader';
        const wrapper = mountWithAppServerContext(
            <AssayDesignEmptyAlert message={expectedMessage} user={TEST_USER_READER} />,
            TEST_PROJECT_APP_CONTEXT_NON_ADMIN,
            homeProjectContext
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toEqual(expectedMessage);
    });
    test('top level folder context', async () => {
        const wrapper = mountWithAppServerContext(
            <AssayDesignEmptyAlert user={TEST_USER_ASSAY_DESIGNER} />,
            TEST_PROJECT_APP_CONTEXT_ADMIN,
            topFolderContext
        );
        await waitForLifecycle(wrapper);

        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(NEW_ASSAY_DESIGN_HREF.toHref());
    });
    test('child project folder context', async () => {
        const wrapper = mountWithAppServerContext(
            <AssayDesignEmptyAlert user={TEST_USER_ASSAY_DESIGNER} />,
            TEST_PROJECT_APP_CONTEXT_ADMIN,
            childProjectContext
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find(EMPTY_ALERT).at(0).text()).toContain('No assays are currently active.');
        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(NEW_ASSAY_DESIGN_HREF.toHref());
    });
    test('child folder but Projects feature not enabled for folder', async () => {
        const wrapper = mountWithAppServerContext(
            <AssayDesignEmptyAlert user={TEST_USER_ASSAY_DESIGNER} />,
            TEST_PROJECT_APP_CONTEXT_ADMIN,
            childFolderNonProjectContext
        );
        await waitForLifecycle(wrapper);

        // Expect link to design
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(NEW_ASSAY_DESIGN_HREF.toHref());
    });
});
