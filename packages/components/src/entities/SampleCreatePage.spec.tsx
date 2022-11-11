import React from 'react';
import { ReactWrapper } from 'enzyme';

import { InsufficientPermissionsPage } from '../internal/components/permissions/InsufficientPermissionsPage';
import { EntityInsertPanel } from '../internal/components/entities/EntityInsertPanel';
import { mountWithAppServerContext, waitForLifecycle } from '../internal/testHelpers';
import { TEST_USER_APP_ADMIN, TEST_USER_AUTHOR, TEST_USER_READER } from '../internal/userFixtures';
import { createMockWithRouterProps } from '../internal/mockUtils';
import { ProductMenuModel } from '../internal/components/navigation/model';

import { SampleCreatePage, SampleCreatePageProps } from './SampleCreatePage';
import { SampleTypeBasePage } from './SampleTypeBasePage';
import { SampleTypeAppContext } from './SampleTypeAppContext';

function getDefaultProps(): SampleCreatePageProps {
    return {
        ...createMockWithRouterProps(jest.fn),
        getIsDirty: jest.fn(),
        loadNameExpressionOptions: jest.fn(async () => ({ prefix: '', allowUserSpecifiedNames: true })),
        menu: new ProductMenuModel(),
        setIsDirty: jest.fn(),
    };
}
const SAMPLE_TYPE_APP_CONTEXT = {} as SampleTypeAppContext;

describe('SampleCreatePage', () => {
    function validate(wrapper: ReactWrapper, hasPermission = true, title = 'Create New Samples'): void {
        expect(wrapper.find(InsufficientPermissionsPage)).toHaveLength(!hasPermission ? 1 : 0);

        if (hasPermission) {
            expect(wrapper.find(SampleTypeBasePage)).toHaveLength(1);
            expect(wrapper.find(SampleTypeBasePage).prop('subtitle')).toBe(title);
            expect(wrapper.find(EntityInsertPanel)).toHaveLength(1);

            const entityDataType = wrapper.find(EntityInsertPanel).prop('entityDataType');
            expect(entityDataType.filterArray.length).toBe(1);
            expect(entityDataType.filterArray[0].getURLParameterName()).toBe('query.Category~neqornull');
            expect(entityDataType.filterArray[0].getURLParameterValue()).toBe('media');
        }
    }

    test('insert reader permissions', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleCreatePage {...getDefaultProps()} />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT },
            {
                user: TEST_USER_READER,
            }
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('insert author permissions', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleCreatePage {...getDefaultProps()} />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT },
            {
                user: TEST_USER_AUTHOR,
            }
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        wrapper.unmount();
    });

    test('author permissions', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleCreatePage {...getDefaultProps()} />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT },
            {
                user: TEST_USER_AUTHOR,
            }
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(EntityInsertPanel).prop('canEditEntityTypeDetails')).toBeFalsy();
        wrapper.unmount();
    });

    test('admin permissions', async () => {
        // works when you put it first, but breaks insert reader permissions
        const wrapper = mountWithAppServerContext(
            <SampleCreatePage {...getDefaultProps()} />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT },
            {
                user: TEST_USER_APP_ADMIN,
            }
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(EntityInsertPanel).prop('canEditEntityTypeDetails')).toBeTruthy();
        wrapper.unmount();
    });

    // TODO refactor this for MediaCreatePage.tsx
    // test('isMedia', async () => {
    //     const wrapper = mountWithAppServerContext(
    //         <SampleCreatePage {...DEFAULT_PROPS} routes={[{path: '/'}, { path: 'media' }, {path: 'rawmaterials'}, {path: 'new'}]} location={{ pathname: '/media/RawMaterials/new', search: '?target=RawMaterials', query: {target: 'RawMaterials', creationType: 'Aliquots'}}} />,
    //         { sampleType: SAMPLE_TYPE_APP_CONTEXT },
    //         { user: App.TEST_USER_APP_ADMIN }
    //     );
    //     await waitForLifecycle(wrapper);
    //     validate(wrapper, true, 'Create New Media', 'RawMaterials');
    //     expect(wrapper.find(EntityInsertPanel).prop('canEditEntityTypeDetails')).toBeFalsy();
    //     expect(wrapper.find(EntityInsertPanel).prop('getFileTemplateUrl').name).toBe('getMediaFileTemplateUrl');
    //     wrapper.unmount();
    // });
});
