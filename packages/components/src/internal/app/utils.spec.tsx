import React, { FC } from 'react';
import { mount } from 'enzyme';

import { MenuSectionConfig, User } from '../..';

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
    addAssaysSectionConfig,
    addSamplesSectionConfig,
    addSourcesSectionConfig,
    biologicsIsPrimaryApp,
    getCurrentAppProperties,
    getMenuSectionConfigs,
    getPrimaryAppProperties,
    getStorageSectionConfig,
    hasPremiumModule,
    isBiologicsEnabled,
    isFreezerManagementEnabled,
    isPremiumProductEnabled,
    isProductNavigationEnabled,
    isSampleManagerEnabled,
    sampleManagerIsPrimaryApp,
    userCanDesignLocations,
    userCanDesignSourceTypes,
} from './utils';
import {
    ASSAYS_KEY,
    BIOLOGICS_APP_PROPERTIES,
    FREEZER_MANAGER_APP_PROPERTIES,
    FREEZERS_KEY,
    MEDIA_KEY,
    NOTEBOOKS_KEY,
    REGISTRY_KEY,
    REQUESTS_KEY,
    SAMPLE_MANAGER_APP_PROPERTIES,
    SAMPLES_KEY,
    SOURCES_KEY,
    USER_KEY,
    WORKFLOW_KEY,
} from './constants';
import { List, Map } from 'immutable';

describe('getMenuSectionConfigs', () => {
    test('sampleManager enabled', () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['samplemanagement', 'study', 'premium'],
            },
            samplemanagement: {
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
        expect(configs.getIn([3, 'workflow', 'seeAllURL'])).toEqual('#/workflow');

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
            api: {
                moduleNames: ['samplemanagement', 'study', 'premium'],
            },
            samplemanagement: {
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
        expect(configs.getIn([4, 'workflow', 'seeAllURL'])).toEqual('#/workflow');

        expect(configs.hasIn([4, 'user'])).toBeTruthy();
    });

    test('SM and FM enabled, FM current app', () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['samplemanagement', 'study', 'premium'],
            },
            samplemanagement: {
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
            '/labkey/samplemanager/app.view#/workflow'
        );

        expect(configs.hasIn([4, 'user'])).toBeTruthy();
    });
});

describe('utils', () => {
    LABKEY.moduleContext = {
        api: {
            moduleNames: ['samplemanagement', 'study', 'premium'],
        },
        samplemanagement: {
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
        expect(isSampleManagerEnabled({ inventory: {}})).toBeFalsy();
    });

    test('isBiologicsEnabled', () => {
        LABKEY.moduleContext = {};
        expect(isBiologicsEnabled()).toBeFalsy();

        LABKEY.moduleContext = {
            inventory: {},
        };
        expect(isBiologicsEnabled()).toBeFalsy();

        LABKEY.moduleContext = {
            inventory: {},
            biologics: {},
        };
        expect(isBiologicsEnabled()).toBeTruthy();
        expect(isBiologicsEnabled({inventory: {}})).toBeFalsy();
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

        LABKEY.moduleContext = {
            inventory: {},
            samplemanagement: {},
            biologics: {},
        };
        expect(isFreezerManagementEnabled()).toBeFalsy();

        LABKEY.moduleContext = {
            inventory: {},
            samplemanagement: {},
            biologics: { isFreezerManagerEnabled: false },
        };
        expect(isFreezerManagementEnabled()).toBeFalsy();

        LABKEY.moduleContext = {
            inventory: {},
            samplemanagement: {},
            biologics: { isFreezerManagerEnabled: true },
        };
        expect(isFreezerManagementEnabled()).toBeTruthy();
        expect(isFreezerManagementEnabled({inventory: {}, samplemanagement: {}, biologics: {}})).toBeFalsy();
        expect(isFreezerManagementEnabled({inventory: {}, samplemanagement: {}, biologics: {}}, SAMPLE_MANAGER_APP_PROPERTIES.productId)).toBeTruthy();
    });

    test('isProductNavigationEnabled', () => {
        LABKEY.moduleContext = {};
        expect(isProductNavigationEnabled(SAMPLE_MANAGER_APP_PROPERTIES.productId)).toBeFalsy();
        expect(isProductNavigationEnabled(BIOLOGICS_APP_PROPERTIES.productId)).toBeFalsy();
        expect(isProductNavigationEnabled(FREEZER_MANAGER_APP_PROPERTIES.productId)).toBeFalsy();

        LABKEY.moduleContext = {
            samplemanagement: {},
        };
        expect(isProductNavigationEnabled(SAMPLE_MANAGER_APP_PROPERTIES.productId)).toBeTruthy();

        LABKEY.moduleContext = {
            samplemanagement: {},
            biologics: {
                isBiologicsSampleManagerNavEnabled: false,
            },
        };
        expect(isProductNavigationEnabled(SAMPLE_MANAGER_APP_PROPERTIES.productId)).toBeFalsy();
        expect(isProductNavigationEnabled(BIOLOGICS_APP_PROPERTIES.productId)).toBeTruthy();

        LABKEY.moduleContext = {
            samplemanagement: {},
            biologics: {
                isBiologicsSampleManagerNavEnabled: true,
            },
        };
        expect(isProductNavigationEnabled(SAMPLE_MANAGER_APP_PROPERTIES.productId)).toBeTruthy();
        expect(isProductNavigationEnabled(BIOLOGICS_APP_PROPERTIES.productId)).toBeTruthy();
    });

    test('hasPremiumModule', () => {
        const Component: FC = () => {
            return <div>{hasPremiumModule() ? 'true' : 'false'}</div>;
        };

        LABKEY.moduleContext = {};
        let wrapper = mount(<Component />);
        expect(wrapper.find('div').text()).toBe('false');
        wrapper.unmount();

        LABKEY.moduleContext = { api: { moduleNames: ['sampleManagement'] } };
        wrapper = mount(<Component />);
        expect(wrapper.find('div').text()).toBe('false');
        wrapper.unmount();

        LABKEY.moduleContext = { api: { moduleNames: ['api', 'core', 'premium'] } };
        wrapper = mount(<Component />);
        expect(wrapper.find('div').text()).toBe('true');
        wrapper.unmount();

        LABKEY.moduleContext = { api: {} };
        wrapper = mount(<Component />);
        expect(wrapper.find('div').text()).toBe('false');
        wrapper.unmount();
    });

    test("isPremiumProductEnabled", () => {
        LABKEY.moduleContext = {};
        expect(isPremiumProductEnabled({})).toBeFalsy();
        expect(isPremiumProductEnabled({inventory: {}})).toBeFalsy();
        expect(isPremiumProductEnabled({samplemanagement: {}, inventory: {}})).toBeTruthy();
        expect(isPremiumProductEnabled({biologics: {}, samplemanagement: {}, inventory: {}})).toBeTruthy();
        LABKEY.moduleContext = {inventory: {}};
        expect(isPremiumProductEnabled()).toBeFalsy();
        LABKEY.moduleContext = {samplemanagement: {}};
        expect(isPremiumProductEnabled()).toBeTruthy();
    });

    test("sampleManagerIsPrimaryApp", () => {
        LABKEY.moduleContext = {};
        expect(sampleManagerIsPrimaryApp()).toBeFalsy();
        expect(sampleManagerIsPrimaryApp({inventory: {}})).toBeFalsy();
        expect(sampleManagerIsPrimaryApp({samplemanagement: {}, inventory: {}})).toBeTruthy();
        expect(sampleManagerIsPrimaryApp({biologics: {}, samplemanagement: {}, inventory: {}})).toBeFalsy();
        LABKEY.moduleContext = {samplemanagement: {}};
        expect(sampleManagerIsPrimaryApp()).toBeTruthy();
    });

    test("biologcisIsPrimaryApp", () => {
        LABKEY.moduleContext = {};
        expect(biologicsIsPrimaryApp()).toBeFalsy();
        expect(biologicsIsPrimaryApp({samplemanagement: {}})).toBeFalsy();
        expect(biologicsIsPrimaryApp({inventory: {}})).toBeFalsy();
        expect(biologicsIsPrimaryApp({biologics: {}, samplemanagement: {}, inventory: {}})).toBeTruthy();
        LABKEY.moduleContext = {biologics: {}, samplemanagement: {}};
        expect(biologicsIsPrimaryApp()).toBeTruthy();
    });

    test("getPrimaryAppProperties", () => {
        LABKEY.moduleContext = {};
        expect(getPrimaryAppProperties()).toBe(undefined);
        expect(getPrimaryAppProperties({inventory: {}})).toStrictEqual(FREEZER_MANAGER_APP_PROPERTIES);
        expect(getPrimaryAppProperties(({inventory: {}, samplemanagement: {}}))).toStrictEqual(SAMPLE_MANAGER_APP_PROPERTIES);
        expect(getPrimaryAppProperties({inventory: {}, samplemanagement: {}, biologics: {}})).toStrictEqual(BIOLOGICS_APP_PROPERTIES);
    });
});

describe("getCurrentAppProperties", () => {
    const { location } = window;

    beforeAll(() => {
        delete window.location;
    });

    afterAll(() => {
        window.location = location;
    });

    test("Sample Manager controller", () => {
        window.location = Object.assign({ ...location }, {
            pathname: "labkey/Sam Man/samplemanager-app.view#",
        });
        expect(getCurrentAppProperties()).toStrictEqual(SAMPLE_MANAGER_APP_PROPERTIES);
        window.location = Object.assign({ ...location }, {
            pathname: "labkey/Biologics/samplemanager-app.view#",
        });
        expect(getCurrentAppProperties()).toStrictEqual(SAMPLE_MANAGER_APP_PROPERTIES);
        window.location = Object.assign({ ...location }, {
            pathname: "labkey/Biologics/sampleManager-app.view#",
        });
        expect(getCurrentAppProperties()).toStrictEqual(SAMPLE_MANAGER_APP_PROPERTIES);
    });

    test("Biologics controller", () => {
        window.location = Object.assign({ ...location }, {
            pathname: "/Biologics/biologics-app.view#",
        });
        expect(getCurrentAppProperties()).toStrictEqual(BIOLOGICS_APP_PROPERTIES);
        window.location = Object.assign({ ...location }, {
            pathname: "/samplemanager/biologics-app.view#",
        });
        expect(getCurrentAppProperties()).toStrictEqual(BIOLOGICS_APP_PROPERTIES);
        window.location = Object.assign({ ...location }, {
            pathname: "/Biologics/BiologicS-app.view#",
        });
        expect(getCurrentAppProperties()).toStrictEqual(BIOLOGICS_APP_PROPERTIES);
    });

    test("Freezer Manager controller", () => {
        window.location = Object.assign({ ...location }, {
            pathname: "/Biologics/freezermanager-app.view#",
        });
        expect(getCurrentAppProperties()).toStrictEqual(FREEZER_MANAGER_APP_PROPERTIES);
        window.location = Object.assign({ ...location }, {
            pathname: "/sampleManager/FreezerManager-app.view#",
        });
        expect(getCurrentAppProperties()).toStrictEqual(FREEZER_MANAGER_APP_PROPERTIES);
    });

    test("Non-app controller", () => {
        window.location = Object.assign({ ...location }, {
            pathname: "/Biologics/project-begin.view",
        });
        expect(getCurrentAppProperties()).toBe(undefined);
    });
});

describe("getStorageSectionConfig", () => {
    test("FM not enabled", () => {
        expect(getStorageSectionConfig(TEST_USER_EDITOR, SAMPLE_MANAGER_APP_PROPERTIES.productId, {}, 2)).toBe(undefined);
        expect(getStorageSectionConfig(TEST_USER_EDITOR, BIOLOGICS_APP_PROPERTIES.productId, {inventory: {}, biologics: {}}, 2)).toBe(undefined);
        expect(getStorageSectionConfig(TEST_USER_EDITOR, BIOLOGICS_APP_PROPERTIES.productId, {inventory: {}, biologics: { isFreezerManagerEnabled: false }}, 2)).toBe(undefined);
    });

    test("reader, inventory app", () => {
        const config = getStorageSectionConfig(TEST_USER_READER, FREEZER_MANAGER_APP_PROPERTIES.productId, { inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId}}, 3);
        expect(config.maxColumns).toBe(1);
        expect(config.maxItemsPerColumn).toBe(3);
        expect(config.emptyText).toBe("No freezers have been defined");
        expect(config.emptyURL).toBe(undefined);
        expect(config.iconURL).toBe("/labkey/_images/freezer_menu.svg")
        expect(config.seeAllURL).toBe("#/home");
        expect(config.headerURL).toBe("#/home");
        expect(config.headerText).toBe(undefined);
    });

    test("reader, non-inventory app", () => {
        const config = getStorageSectionConfig(TEST_USER_READER, SAMPLE_MANAGER_APP_PROPERTIES.productId, { inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId}}, 4);
        expect(config.maxItemsPerColumn).toBe(4);
        expect(config.seeAllURL).toBe("/labkey/freezermanager/app.view#/home");
        expect(config.headerURL).toBe("/labkey/freezermanager/app.view#/home");
        expect(config.emptyURL).toBe(undefined);
    });

    test("editor", () => {
        const config = getStorageSectionConfig(TEST_USER_FOLDER_ADMIN, BIOLOGICS_APP_PROPERTIES.productId, { inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId}}, 4);
        expect(config.maxItemsPerColumn).toBe(4);
        expect(config.seeAllURL).toBe("/labkey/freezermanager/app.view#/home");
        expect(config.headerURL).toBe("/labkey/freezermanager/app.view#/home");
        expect(config.emptyURL).toBe("/labkey/freezermanager/app.view#/freezers/new")
        expect(config.emptyURLText).toBe("Create a freezer")
    });
});

describe("addSourcesSectionConfig", () => {
    test("reader", () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addSourcesSectionConfig(TEST_USER_READER, "/labkey/test/app.view", configs);
        expect(configs.size).toBe(1);
        const sectionConfig = configs.get(0).get(SOURCES_KEY);
        expect(sectionConfig.maxColumns).toBe(1);
        expect(sectionConfig.maxItemsPerColumn).toBe(12);
        expect(sectionConfig.emptyText).toBe("No source types have been defined");
        expect(sectionConfig.emptyURL).toBe(undefined);
        expect(sectionConfig.seeAllURL).toBe("/labkey/test/app.view#/sources?viewAs=grid");
        expect(sectionConfig.showActiveJobIcon).toBe(true);
        expect(sectionConfig.iconURL).toBe("/labkey/_images/source_type.svg");
        expect(sectionConfig.headerURL).toBe(undefined);
        expect(sectionConfig.headerText).toBe(undefined);
    });

    test("admin", () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addSourcesSectionConfig(TEST_USER_FOLDER_ADMIN, "/labkey/test/app.view", configs);
        expect(configs.size).toBe(1);
        const sectionConfig = configs.get(0).get(SOURCES_KEY);
        expect(sectionConfig.emptyText).toBe("No source types have been defined");
        expect(sectionConfig.emptyURL).toBe("/labkey/test/app.view#/sourceType/new");
        expect(sectionConfig.emptyURLText).toBe("Create a source type");
    });
});

describe("addSamplesSectionConfig", () => {
    test("reader", () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addSamplesSectionConfig(TEST_USER_READER, "/labkey/samplemanager/app.view", configs);
        expect(configs.size).toBe(1);
        const sectionConfig = configs.get(0).get(SAMPLES_KEY);
        expect(sectionConfig.maxColumns).toBe(1);
        expect(sectionConfig.maxItemsPerColumn).toBe(12);
        expect(sectionConfig.emptyText).toBe("No sample types have been defined");
        expect(sectionConfig.emptyURL).toBe(undefined);
        expect(sectionConfig.seeAllURL).toBe("/labkey/samplemanager/app.view#/samples?viewAs=cards");
        expect(sectionConfig.showActiveJobIcon).toBe(true);
        expect(sectionConfig.iconURL).toBe("/labkey/_images/samples.svg");
        expect(sectionConfig.headerURL).toBe(undefined);
        expect(sectionConfig.headerText).toBe(undefined);
    });

    test("admin", () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addSamplesSectionConfig(TEST_USER_FOLDER_ADMIN, "/labkey/samplemanager/app.view", configs);
        expect(configs.size).toBe(1);
        const sectionConfig = configs.get(0).get(SAMPLES_KEY);
        expect(sectionConfig.emptyURL).toBe("/labkey/samplemanager/app.view#/sampleType/new");
        expect(sectionConfig.emptyURLText).toBe("Create a sample type");
    });
});

describe("addAssaySectionConfig", () => {
    test("reader", () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addAssaysSectionConfig(TEST_USER_READER, "/labkey/test/app.view", configs);
        expect(configs.size).toBe(1);
        const sectionConfig = configs.get(0).get(ASSAYS_KEY);
        expect(sectionConfig.maxColumns).toBe(2);
        expect(sectionConfig.maxItemsPerColumn).toBe(12);
        expect(sectionConfig.emptyText).toBe("No assays have been defined");
        expect(sectionConfig.emptyURL).toBe(undefined);
        expect(sectionConfig.seeAllURL).toBe("/labkey/test/app.view#/assays?viewAs=grid");
        expect(sectionConfig.showActiveJobIcon).toBe(true);
        expect(sectionConfig.iconURL).toBe("/labkey/_images/assay.svg");
        expect(sectionConfig.headerURL).toBe(undefined);
        expect(sectionConfig.headerText).toBe(undefined);
    });

    test("admin", () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addAssaysSectionConfig(TEST_USER_FOLDER_ADMIN, "/labkey/test/app.view", configs);
        expect(configs.size).toBe(1);
        const sectionConfig = configs.get(0).get(ASSAYS_KEY);
        expect(sectionConfig.emptyText).toBe("No assays have been defined");
        expect(sectionConfig.emptyURL).toBe("/labkey/test/app.view#/assayDesign/new");
        expect(sectionConfig.emptyURLText).toBe("Create an assay design");
    });
});

describe("getMenuSectionConfigs", () => {
    const { location } = window;

    beforeAll(() => {
        LABKEY.moduleContext = {};
        delete window.location;
    });

    afterAll(() => {
        window.location = location;
    });

    test("Sample Manager", () => {
        window.location = Object.assign({...location}, {
            pathname: "labkey/Samples/sampleManager-app.view#"
        });
        const configs = getMenuSectionConfigs(TEST_USER_READER, SAMPLE_MANAGER_APP_PROPERTIES.productId, {inventory: {}, samplemanagement: {}});
        expect(configs.size).toBe(5);
        expect(configs.getIn([0, SOURCES_KEY])).toBeDefined();
        expect(configs.getIn([1, SAMPLES_KEY])).toBeDefined();
        expect(configs.getIn([2, ASSAYS_KEY])).toBeDefined();
        expect(configs.getIn([3, FREEZERS_KEY])).toBeDefined();
        expect(configs.getIn([4, WORKFLOW_KEY])).toBeDefined();
        expect(configs.getIn([4, USER_KEY])).toBeDefined();
    });

    test("Biologics primary, in Sample Manager", () => {
        window.location = Object.assign({ ...location }, {
            pathname: "labkey/Biologics/samplemanager-app.view#",
        });
        const configs = getMenuSectionConfigs(TEST_USER_READER, SAMPLE_MANAGER_APP_PROPERTIES.productId, {inventory: {}, samplemanagement: {}, biologics: {}});
        expect(configs.size).toBe(5);
        expect(configs.getIn([0, SOURCES_KEY])).toBeDefined();
        expect(configs.getIn([1, SAMPLES_KEY])).toBeDefined();
        expect(configs.getIn([2, ASSAYS_KEY])).toBeDefined();
        expect(configs.getIn([3, FREEZERS_KEY])).toBeDefined();
        expect(configs.getIn([4, WORKFLOW_KEY])).toBeDefined();
        expect(configs.getIn([4, USER_KEY])).toBeDefined();
    });

    test("Biologics, no experimental features", () => {
        window.location = Object.assign({ ...location }, {
            pathname: "labkey/Biologics/biologics-app.view#",
        });
        const configs = getMenuSectionConfigs(TEST_USER_READER, BIOLOGICS_APP_PROPERTIES.productId, {inventory: {}, samplemanagement: {}, biologics: {}});
        expect(configs.size).toBe(4);
        expect(configs.getIn([0, REGISTRY_KEY])).toBeDefined();
        expect(configs.getIn([1, SAMPLES_KEY])).toBeDefined();
        expect(configs.getIn([2, ASSAYS_KEY])).toBeDefined();
        expect(configs.getIn([3, WORKFLOW_KEY])).toBeDefined();
        expect(configs.getIn([3, MEDIA_KEY])).toBeDefined();
        expect(configs.getIn([3, NOTEBOOKS_KEY])).toBeDefined();
    });

    test("Biologics with Requests", () => {
        window.location = Object.assign({ ...location }, {
            pathname: "labkey/Biologics/biologics-app.view#",
        });
        const configs = getMenuSectionConfigs(TEST_USER_READER, SAMPLE_MANAGER_APP_PROPERTIES.productId,
            {inventory: {}, samplemanagement: {}, biologics: {'experimental-biologics-requests-menu': true}});
        expect(configs.size).toBe(5);
        expect(configs.getIn([0, REGISTRY_KEY])).toBeDefined();
        expect(configs.getIn([1, SAMPLES_KEY])).toBeDefined();
        expect(configs.getIn([2, ASSAYS_KEY])).toBeDefined();
        expect(configs.getIn([3, REQUESTS_KEY])).toBeDefined();
        expect(configs.getIn([4, WORKFLOW_KEY])).toBeDefined();
        expect(configs.getIn([4, MEDIA_KEY])).toBeDefined();
        expect(configs.getIn([4, NOTEBOOKS_KEY])).toBeDefined();
    });

    test("Biologics with FM", () => {
        window.location = Object.assign({ ...location }, {
            pathname: "labkey/Biologics/biologics-app.view#",
        });
        const configs = getMenuSectionConfigs(TEST_USER_READER, SAMPLE_MANAGER_APP_PROPERTIES.productId,
            {inventory: {}, samplemanagement: {}, biologics: {isFreezerManagerEnabled: true}});
        expect(configs.size).toBe(5);
        expect(configs.getIn([0, REGISTRY_KEY])).toBeDefined();
        expect(configs.getIn([1, SAMPLES_KEY])).toBeDefined();
        expect(configs.getIn([2, ASSAYS_KEY])).toBeDefined();
        expect(configs.getIn([3, FREEZERS_KEY])).toBeDefined();
        expect(configs.getIn([4, WORKFLOW_KEY])).toBeDefined();
        expect(configs.getIn([4, MEDIA_KEY])).toBeDefined();
        expect(configs.getIn([4, NOTEBOOKS_KEY])).toBeDefined();
    });

    test("Biologics with FM and Requests", () => {
        window.location = Object.assign({ ...location }, {
            pathname: "labkey/Biologics/biologics-app.view#",
        });
        const configs = getMenuSectionConfigs(TEST_USER_READER, SAMPLE_MANAGER_APP_PROPERTIES.productId,
            {inventory: {}, samplemanagement: {}, biologics: {'experimental-biologics-requests-menu': true, isFreezerManagerEnabled: true}});
        expect(configs.size).toBe(5);
        expect(configs.getIn([0, REGISTRY_KEY])).toBeDefined();
        expect(configs.getIn([1, SAMPLES_KEY])).toBeDefined();
        expect(configs.getIn([2, ASSAYS_KEY])).toBeDefined();
        expect(configs.getIn([3, REQUESTS_KEY])).toBeDefined();
        expect(configs.getIn([3, FREEZERS_KEY])).toBeDefined();
        expect(configs.getIn([4, WORKFLOW_KEY])).toBeDefined();
        expect(configs.getIn([4, MEDIA_KEY])).toBeDefined();
        expect(configs.getIn([4, NOTEBOOKS_KEY])).toBeDefined();
    });

    test("Freezer Manager", () => {
        window.location = Object.assign({ ...location }, {
            pathname: "labkey/Cold Storage/freezermanager-app.view#",
        });
        const configs = getMenuSectionConfigs(TEST_USER_READER, FREEZER_MANAGER_APP_PROPERTIES.productId,
            {inventory: {}});
        expect(configs.size).toBe(2);
        expect(configs.getIn([0, FREEZERS_KEY])).toBeDefined();
        expect(configs.getIn([1, USER_KEY])).toBeDefined();
    });

});
