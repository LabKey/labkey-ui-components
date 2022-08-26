import React from 'react';
import { Dropdown, MenuItem } from 'react-bootstrap';

import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../../test/data/constants';
import { mountWithAppServerContext, waitForLifecycle } from '../../testHelpers';
import { BIOLOGICS_APP_PROPERTIES } from '../../app/constants';

import { getTestAPIWrapper } from '../../APIWrapper';

import { getSecurityTestAPIWrapper, SecurityAPIWrapper } from '../security/APIWrapper';

import { FolderMenu } from './FolderMenu';
import {AppContext} from "../../AppContext";
import {LoadingSpinner} from "../base/LoadingSpinner";
import {Alert} from "../base/Alert";

describe('FolderMenu', () => {
    function getDefaultProps() {
        return {
            appProperties: BIOLOGICS_APP_PROPERTIES,
        };
    }

    function getDefaultAppContext(overrides?: Partial<SecurityAPIWrapper>): Partial<AppContext> {
        return {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    fetchContainers: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER, TEST_FOLDER_CONTAINER]),
                    ...overrides,
                }),
            }),
        };
    }

    function getDefaultServerContext() {
        return {
            container: TEST_PROJECT_CONTAINER,
        };
    }

    it('displays loading and errors', async () => {
        const expectedError = 'This is a failure.';

        const wrapper = mountWithAppServerContext(
            <FolderMenu {...getDefaultProps()} />,
            getDefaultAppContext({
                fetchContainers: jest.fn().mockRejectedValue(expectedError),
            }),
            getDefaultServerContext()
        );

        expect(wrapper.find(LoadingSpinner).length).toEqual(1);

        // load
        await waitForLifecycle(wrapper);

        expect(wrapper.find(Alert).text()).toEqual(`Error: ${expectedError}`);
    });

    it('loads successfully', async () => {
        const wrapper = mountWithAppServerContext(
            <FolderMenu {...getDefaultProps()} />,
            getDefaultAppContext(),
            getDefaultServerContext()
        );

        // Verify current folder title is displayed even while loading
        // Bootstrap dropdown adds whitespace
        expect(wrapper.find(Dropdown.Toggle).text()).toEqual(TEST_PROJECT_CONTAINER.title + ' ');

        // load
        await waitForLifecycle(wrapper);

        const menuItems = wrapper.find(MenuItem);
        expect(menuItems.length).toEqual(2);
        const projectItem = menuItems.at(0);
        const folderItem = menuItems.at(1);
        expect(projectItem.text()).toEqual(TEST_PROJECT_CONTAINER.title);
        expect(projectItem.prop('active')).toEqual(true);
        expect(projectItem.prop('href')).toBeDefined();

        expect(folderItem.text()).toEqual(TEST_FOLDER_CONTAINER.title);
        expect(folderItem.prop('active')).toEqual(false);
        expect(projectItem.prop('href')).toBeDefined();
    });
});
