import React from 'react';
import { ReactWrapper } from 'enzyme';
import { PermissionTypes } from '@labkey/api';

import {TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER} from '../test/data/constants';
import { createMockWithRouterProps } from '../internal/mockUtils';
import { getTestAPIWrapper } from '../internal/APIWrapper';
import { getQueryTestAPIWrapper } from '../internal/query/APIWrapper';
import { TEST_USER_FOLDER_ADMIN } from '../internal/userFixtures';
import { SampleTypeDesigner } from '../internal/components/domainproperties/samples/SampleTypeDesigner';
import { ProductMenuModel } from '../internal/components/navigation/model';
import { mountWithAppServerContext, waitForLifecycle } from '../internal/testHelpers';
import { QueryInfo } from '../public/QueryInfo';
import { getSamplesTestAPIWrapper } from '../internal/components/samples/APIWrapper';
import { getSecurityTestAPIWrapper } from '../internal/components/security/APIWrapper';
import { DomainDetails } from '../internal/components/domainproperties/models';

import { Container } from '../internal/components/base/models/Container';

import { getEntityTestAPIWrapper } from '../internal/components/entities/APIWrapper';

import { SampleTypeAppContext } from './SampleTypeAppContext';

import { SampleTypeBasePage } from './SampleTypeBasePage';
import { SampleTypeDesignPage } from './SampleTypeDesignPage';

describe('SampleTypeDesignPage', () => {
    const QUERY_INFO = QueryInfo.create({ domainContainerPath: TEST_PROJECT_CONTAINER.path });

    const API = getTestAPIWrapper(jest.fn, {
        entity: getEntityTestAPIWrapper(jest.fn, {
            loadNameExpressionOptions: () => Promise.resolve({ allowUserSpecifiedNames: false, prefix: 'PREFIX' }),
        }),
        query: getQueryTestAPIWrapper(jest.fn, {
            getQueryDetails: () => Promise.resolve(QUERY_INFO),
        }),
        samples: getSamplesTestAPIWrapper(jest.fn, {
            getSampleTypeDetails: () => Promise.resolve(DomainDetails.create()),
        }),
        security: getSecurityTestAPIWrapper(jest.fn, {
            fetchContainers: () =>
                Promise.resolve([
                    {
                        ...TEST_PROJECT_CONTAINER,
                        effectivePermissions: [PermissionTypes.DesignSampleSet],
                    } as Container,
                ]),
        }),
    });

    const SAMPLE_TYPE_APP_CONTEXT = {
        getMetricUnitOptions: () => [],
        showStudyProperties: true,
        hideConditionalFormatting: false,
        readOnlyQueryNames: []
    } as SampleTypeAppContext;

    const DEFAULT_PROPS = {
        menu: new ProductMenuModel({
            isLoaded: true,
            isLoading: false,
        }),
        navigate: jest.fn(),
        menuInit: jest.fn(),
        routes: [{ path: '#' }, { path: 'sampleType' }, { path: 'Blood' }],
        params: { sampleType: 'Blood' },
    };

    function validate(
        wrapper: ReactWrapper,
        hasPerm = true,
        isUpdate = true,
        showStudyProps = true,
        isMedia = false,
        hideConditionalFormatting = false,
        nameReadOnly?: boolean
    ): void {
        expect(wrapper.find(SampleTypeBasePage)).toHaveLength(hasPerm ? 1 : 0);
        expect(wrapper.find(SampleTypeDesigner)).toHaveLength(hasPerm ? 1 : 0);

        if (hasPerm) {
            expect(wrapper.find(SampleTypeBasePage).prop('title')).toBe('Sample Type');
            expect(wrapper.find(SampleTypeBasePage).prop('subtitle')).toBe(
                isUpdate ? 'Edit Sample Type Design' : 'Create a New Sample Type'
            );
            expect(wrapper.find(SampleTypeDesigner).prop('saveBtnText')).toBe(
                isUpdate ? 'Finish Updating Sample Type' : 'Finish Creating Sample Type'
            );
            expect(wrapper.find(SampleTypeDesigner).prop('initModel').domainDesign.allowTimepointProperties).toBe(
                showStudyProps
            );
            expect(wrapper.find(SampleTypeDesigner).prop('initModel').nameReadOnly).toBe(nameReadOnly);
            expect(wrapper.find(SampleTypeDesigner).prop('showLinkToStudy')).toBe(showStudyProps);
            expect(wrapper.find(SampleTypeDesigner).prop('metricUnitProps').metricUnitRequired).toBe(!isUpdate);
            expect(wrapper.find(SampleTypeDesigner).prop('metricUnitProps').includeMetricUnitProperty).toBe(!isMedia);
            expect(wrapper.find(SampleTypeDesigner).prop('showGenIdBanner')).toBe(isUpdate);
            expect(wrapper.find(SampleTypeDesigner).prop('appPropertiesOnly')).toBe(!isMedia);
            expect(wrapper.find(SampleTypeDesigner).prop('domainFormDisplayOptions').hideConditionalFormatting).toBe(hideConditionalFormatting);

            const validatePropertiesFn = wrapper.find(SampleTypeDesigner).prop('validateProperties');
            if (isUpdate && !isMedia) expect(validatePropertiesFn).toBeDefined();
            else expect(validatePropertiesFn).toBeUndefined();
        }
    }

    test('default props', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleTypeDesignPage {...createMockWithRouterProps(jest.fn)} {...DEFAULT_PROPS} />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT, api: API },
            { user: TEST_USER_FOLDER_ADMIN, container: TEST_PROJECT_CONTAINER }
        );
        await waitForLifecycle(wrapper, 1000);
        validate(wrapper);
        expect(wrapper.find('.alert-warning')).toHaveLength(0);
        wrapper.unmount();
    });

    test('create sample type', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleTypeDesignPage {...createMockWithRouterProps(jest.fn)} {...DEFAULT_PROPS} params={{}} />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT, api: API },
            { user: TEST_USER_FOLDER_ADMIN, container: TEST_PROJECT_CONTAINER }
        );
        await waitForLifecycle(wrapper, 1000);
        validate(wrapper, true, false);
        wrapper.unmount();
    });

    test('isMedia', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleTypeDesignPage
                {...createMockWithRouterProps(jest.fn)}
                {...DEFAULT_PROPS}
                routes={[{ path: '#' }, { path: 'media' }, { path: 'RawMaterials' }]}
            />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT, api: API },
            { user: TEST_USER_FOLDER_ADMIN, container: TEST_PROJECT_CONTAINER }
        );
        await waitForLifecycle(wrapper, 1000);
        validate(wrapper, true, true, true, true);
        wrapper.unmount();
    });

    test('insufficient permissions', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleTypeDesignPage {...createMockWithRouterProps(jest.fn)} {...DEFAULT_PROPS} />,
            {
                sampleType: SAMPLE_TYPE_APP_CONTEXT,
                api: {
                    ...API,
                    security: getSecurityTestAPIWrapper(jest.fn, {
                        fetchContainers: () =>
                            Promise.resolve([
                                {
                                    ...TEST_PROJECT_CONTAINER,
                                    effectivePermissions: [],
                                } as Container,
                            ]),
                    }),
                },
            },
            { user: TEST_USER_FOLDER_ADMIN, container: TEST_PROJECT_CONTAINER }
        );
        await waitForLifecycle(wrapper, 1000);
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('showStudyProperties false', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleTypeDesignPage {...createMockWithRouterProps(jest.fn)} {...DEFAULT_PROPS} />,
            {
                sampleType: {
                    ...SAMPLE_TYPE_APP_CONTEXT,
                    showStudyProperties: false,
                },
                api: API,
            },
            { user: TEST_USER_FOLDER_ADMIN, container: TEST_PROJECT_CONTAINER }
        );
        await waitForLifecycle(wrapper, 1000);
        validate(wrapper, true, true, false);
        wrapper.unmount();
    });

    test('hideConditionalFormatting true', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleTypeDesignPage {...createMockWithRouterProps(jest.fn)} {...DEFAULT_PROPS} />,
            {
                sampleType: {
                    ...SAMPLE_TYPE_APP_CONTEXT,
                    hideConditionalFormatting: true,
                },
                api: API,
            },
            { user: TEST_USER_FOLDER_ADMIN, container: TEST_PROJECT_CONTAINER }
        );
        await waitForLifecycle(wrapper, 1000);
        validate(wrapper, true, true, true, false, true);
        wrapper.unmount();
    });

    test('readOnlyQueryNames', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleTypeDesignPage {...createMockWithRouterProps(jest.fn)} {...DEFAULT_PROPS} />,
            {
                sampleType: {
                    ...SAMPLE_TYPE_APP_CONTEXT,
                    readOnlyQueryNames: ['blood'],
                },
                api: API,
            },
            { user: TEST_USER_FOLDER_ADMIN, container: TEST_PROJECT_CONTAINER }
        );
        await waitForLifecycle(wrapper, 1000);
        validate(wrapper, true, true, true, false, false, true);
        wrapper.unmount();
    });

    test('isInOtherFolder', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleTypeDesignPage {...createMockWithRouterProps(jest.fn)} {...DEFAULT_PROPS} />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT, api: API },
            { user: TEST_USER_FOLDER_ADMIN, container: TEST_FOLDER_CONTAINER }
        );
        await waitForLifecycle(wrapper, 1000);
        validate(wrapper);
        expect(wrapper.find('.alert-warning')).toHaveLength(1);
        expect(wrapper.find('.alert-warning').text()).toContain('This is a shared sample type');
        wrapper.unmount();
    });
});
