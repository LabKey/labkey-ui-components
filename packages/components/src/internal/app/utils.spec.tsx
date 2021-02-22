import React, { FC } from "react";
import { mount } from "enzyme";

import { User } from '../..';

import {
    TEST_USER_APP_ADMIN,
    TEST_USER_ASSAY_DESIGNER,
    TEST_USER_AUTHOR,
    TEST_USER_EDITOR,
    TEST_USER_FOLDER_ADMIN,
    TEST_USER_GUEST,
    TEST_USER_READER,
} from '../../test/data/users';

import {
    getMenuSectionConfigs,
    hasPremiumModule,
    isFreezerManagementEnabled,
    isSampleManagerEnabled,
    userCanDesignLocations,
    userCanDesignSourceTypes,
} from './utils';

describe('getMenuSectionConfigs', () => {
    test('sampleManager enabled', () => {
        LABKEY.moduleContext = {
            samplemanagement: {
                hasPremiumModule: true,
                hasStudyModule: true,
                productId: 'SampleManager',
            },
        };
        const configs = getMenuSectionConfigs(new User(), 'sampleManager');

        expect(configs.size).toBe(4);
        expect(configs.hasIn([0, 'sources'])).toBeTruthy();
        expect(configs.getIn([0, 'sources', 'seeAllURL'])).toEqual('#/sources?viewAs=grid');

        expect(configs.hasIn([1, 'samples'])).toBeTruthy();
        expect(configs.getIn([1, 'samples', 'seeAllURL'])).toEqual('#/samples?viewAs=cards');

        expect(configs.hasIn([2, 'assays'])).toBeTruthy();
        expect(configs.getIn([2, 'assays', 'seeAllURL'])).toEqual('#/assays?viewAs=grid');

        expect(configs.hasIn([3, 'workflow'])).toBeTruthy();
        expect(configs.getIn([3, 'workflow', 'seeAllURL'])).toEqual('#/workflow?viewAs=heatmap');

        expect(configs.hasIn([3, 'user'])).toBeTruthy();
    });

    test('freezerManager enabled', () => {
        LABKEY.moduleContext = {
            inventory: {
                productId: 'freezerManager',
            },
        };
        const configs = getMenuSectionConfigs(new User(), 'freezerManager');

        expect(configs.size).toBe(2);
        expect(configs.hasIn([0, 'freezers'])).toBeTruthy();
        expect(configs.getIn([0, 'freezers', 'seeAllURL'])).toEqual('#/home');

        expect(configs.hasIn([1, 'user'])).toBeTruthy();
    });

    test('SM and FM enabled, SM current app', () => {
        LABKEY.moduleContext = {
            samplemanagement: {
                hasPremiumModule: true,
                hasStudyModule: true,
                productId: 'SampleManager',
            },
            inventory: {
                productId: 'freezerManager',
            },
        };

        const configs = getMenuSectionConfigs(new User(), 'sampleManager');
        expect(configs.size).toBe(5);
        expect(configs.hasIn([0, 'sources'])).toBeTruthy();
        expect(configs.getIn([0, 'sources', 'seeAllURL'])).toEqual('#/sources?viewAs=grid');

        expect(configs.hasIn([1, 'samples'])).toBeTruthy();
        expect(configs.getIn([1, 'samples', 'seeAllURL'])).toEqual('#/samples?viewAs=cards');

        expect(configs.hasIn([2, 'assays'])).toBeTruthy();
        expect(configs.getIn([2, 'assays', 'seeAllURL'])).toEqual('#/assays?viewAs=grid');

        expect(configs.hasIn([3, 'freezers'])).toBeTruthy();
        expect(configs.getIn([3, 'freezers', 'seeAllURL'])).toEqual('/labkey/freezermanager/app.view#/home');

        expect(configs.hasIn([4, 'workflow'])).toBeTruthy();
        expect(configs.getIn([4, 'workflow', 'seeAllURL'])).toEqual('#/workflow?viewAs=heatmap');

        expect(configs.hasIn([4, 'user'])).toBeTruthy();
    });

    test('SM and FM enabled, FM current app', () => {
        LABKEY.moduleContext = {
            samplemanagement: {
                hasPremiumModule: true,
                hasStudyModule: true,
                productId: 'SampleManager',
            },
            inventory: {
                productId: 'freezerManager',
            },
        };

        const configs = getMenuSectionConfigs(new User(), 'freezerManager');
        expect(configs.size).toBe(5);
        expect(configs.hasIn([0, 'sources'])).toBeTruthy();
        expect(configs.getIn([0, 'sources', 'seeAllURL'])).toEqual(
            '/labkey/samplemanager/app.view#/sources?viewAs=grid'
        );

        expect(configs.hasIn([1, 'samples'])).toBeTruthy();
        expect(configs.getIn([1, 'samples', 'seeAllURL'])).toEqual(
            '/labkey/samplemanager/app.view#/samples?viewAs=cards'
        );

        expect(configs.hasIn([2, 'assays'])).toBeTruthy();
        expect(configs.getIn([2, 'assays', 'seeAllURL'])).toEqual('/labkey/samplemanager/app.view#/assays?viewAs=grid');

        expect(configs.hasIn([3, 'freezers'])).toBeTruthy();
        expect(configs.getIn([3, 'freezers', 'seeAllURL'])).toEqual('#/home');

        expect(configs.hasIn([4, 'workflow'])).toBeTruthy();
        expect(configs.getIn([4, 'workflow', 'seeAllURL'])).toEqual(
            '/labkey/samplemanager/app.view#/workflow?viewAs=heatmap'
        );

        expect(configs.hasIn([4, 'user'])).toBeTruthy();
    });
});

describe('utils', () => {
    LABKEY.moduleContext = {
        samplemanagement: {
            hasPremiumModule: true,
            hasStudyModule: true,
            productId: 'SampleManager',
        },
    };

    test('userCanDesignSourceTypes', () => {
        expect(userCanDesignSourceTypes(TEST_USER_GUEST)).toBeFalsy();
        expect(userCanDesignSourceTypes(TEST_USER_READER)).toBeFalsy();
        expect(userCanDesignSourceTypes(TEST_USER_AUTHOR)).toBeFalsy();
        expect(userCanDesignSourceTypes(TEST_USER_EDITOR)).toBeFalsy();
        expect(userCanDesignSourceTypes(TEST_USER_ASSAY_DESIGNER)).toBeFalsy();
        expect(userCanDesignSourceTypes(TEST_USER_FOLDER_ADMIN)).toBeTruthy();
        expect(userCanDesignSourceTypes(TEST_USER_APP_ADMIN)).toBeTruthy();
    });

    test('userCanDesignLocations', () => {
        expect(userCanDesignLocations(TEST_USER_GUEST)).toBeFalsy();
        expect(userCanDesignLocations(TEST_USER_READER)).toBeFalsy();
        expect(userCanDesignLocations(TEST_USER_AUTHOR)).toBeFalsy();
        expect(userCanDesignLocations(TEST_USER_EDITOR)).toBeFalsy();
        expect(userCanDesignLocations(TEST_USER_ASSAY_DESIGNER)).toBeFalsy();
        expect(userCanDesignLocations(TEST_USER_FOLDER_ADMIN)).toBeTruthy();
        expect(userCanDesignLocations(TEST_USER_APP_ADMIN)).toBeTruthy();
    });

    test('isSampleManagerEnabled', () => {
        LABKEY.moduleContext = {};
        expect(isSampleManagerEnabled()).toBeFalsy();

        LABKEY.moduleContext = {
            inventory: {},
        };
        expect(isSampleManagerEnabled()).toBeFalsy();

        LABKEY.moduleContext = {
            inventory: {},
            samplemanagement: {},
        };
        expect(isSampleManagerEnabled()).toBeTruthy();
    });

    test('isFreezerManagementEnabled', () => {
        LABKEY.moduleContext = {};
        expect(isFreezerManagementEnabled()).toBeFalsy();

        LABKEY.moduleContext = {
            inventory: {},
        };
        expect(isFreezerManagementEnabled()).toBeTruthy();

        LABKEY.moduleContext = {
            inventory: {},
            samplemanagement: {},
        };
        expect(isFreezerManagementEnabled()).toBeTruthy();
    });

    test('hasPremiumModule', () => {
        const Component: FC = () => {
            return <div>{hasPremiumModule() ? 'true' : 'false'}</div>;
        };

        let wrapper = mount(<Component />);
        expect(wrapper.find('div').text()).toBe('false');
        wrapper.unmount();

        LABKEY.moduleContext = {};
        wrapper = mount(<Component />);
        expect(wrapper.find('div').text()).toBe('false');
        wrapper.unmount();

        LABKEY.moduleContext = { samplemanagement: {} };
        wrapper = mount(<Component />);
        expect(wrapper.find('div').text()).toBe('false');
        wrapper.unmount();

        LABKEY.moduleContext = { samplemanagement: { hasPremiumModule: false } };
        wrapper = mount(<Component />);
        expect(wrapper.find('div').text()).toBe('false');
        wrapper.unmount();

        LABKEY.moduleContext = { samplemanagement: { hasPremiumModule: true } };
        wrapper = mount(<Component />);
        expect(wrapper.find('div').text()).toBe('true');
        wrapper.unmount();
    });
});
