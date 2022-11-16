import React from 'react';
import { ReactWrapper } from 'enzyme';

import { InsufficientPermissionsPage } from '../internal/components/permissions/InsufficientPermissionsPage';
import { EntityInsertPanel } from '../internal/components/entities/EntityInsertPanel';
import { mountWithAppServerContext, waitForLifecycle } from '../internal/testHelpers';
import { TEST_USER_APP_ADMIN, TEST_USER_AUTHOR, TEST_USER_EDITOR, TEST_USER_READER } from '../internal/userFixtures';
import { createMockWithRouterProps } from '../internal/mockUtils';
import { ProductMenuModel } from '../internal/components/navigation/model';
import { BACKGROUND_IMPORT_MIN_FILE_SIZE } from '../internal/components/pipeline/constants';

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
    function validate(wrapper: ReactWrapper, hasPermission = true): void {
        expect(wrapper.find(InsufficientPermissionsPage)).toHaveLength(!hasPermission ? 1 : 0);
        expect(wrapper.find(SampleTypeBasePage)).toHaveLength(hasPermission ? 1 : 0);
        expect(wrapper.find(EntityInsertPanel)).toHaveLength(hasPermission ? 1 : 0);

        if (hasPermission) {
            expect(wrapper.find(SampleTypeBasePage).prop('title')).toBe('Sample Type');
            expect(wrapper.find(SampleTypeBasePage).prop('subtitle')).toBe('Create New Samples');
            const entityDataType = wrapper.find(EntityInsertPanel).prop('entityDataType');
            expect(entityDataType.filterArray.length).toBe(1);
            expect(entityDataType.filterArray[0].getURLParameterName()).toBe('query.Category~neqornull');
            expect(entityDataType.filterArray[0].getURLParameterValue()).toBe('media');
        }
    }

    test('reader', async () => {
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

    test('author', async () => {
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

    test('editor', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleCreatePage {...getDefaultProps()} />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT },
            {
                user: TEST_USER_EDITOR,
            }
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(EntityInsertPanel).prop('canEditEntityTypeDetails')).toBeFalsy();
        wrapper.unmount();
    });

    test('admin', async () => {
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
        expect(wrapper.find(EntityInsertPanel).prop('asyncSize')).toBe(BACKGROUND_IMPORT_MIN_FILE_SIZE);
        wrapper.unmount();
    });

    test('useAsync', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleCreatePage
                {...getDefaultProps()}
                location={{ ...getDefaultProps().location, query: { useAsync: 'true' } }}
            />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT },
            {
                user: TEST_USER_APP_ADMIN,
            }
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(EntityInsertPanel).prop('asyncSize')).toBe(1);
        wrapper.unmount();
    });
});
