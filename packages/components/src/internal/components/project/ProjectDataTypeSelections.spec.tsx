import React from 'react';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';

import { AssayRunDataType, SampleTypeDataType } from '../entities/constants';

import { TEST_FOLDER_CONTAINER } from '../../containerFixtures';

import { getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';

import { ProjectDataTypeSelections } from './ProjectDataTypeSelections';

describe('ProjectDataTypeSelections', () => {
    const API = getFolderTestAPIWrapper(jest.fn, {
        getFolderDataTypeExclusions: jest.fn().mockResolvedValue({}),
    });

    test('without selected project - new project', async () => {
        const wrapper = mountWithAppServerContext(
            <ProjectDataTypeSelections api={API} entityDataTypes={[SampleTypeDataType]} />
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('button')).toHaveLength(0);
    });

    test('with project', async () => {
        const wrapper = mountWithAppServerContext(
            <ProjectDataTypeSelections
                api={API}
                entityDataTypes={[SampleTypeDataType]}
                project={TEST_FOLDER_CONTAINER}
            />
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('button').text()).toBe('Save');
        expect(wrapper.find('.project-datatype-col')).toHaveLength(1);
    });

    test('with 2 entityDataTypes', async () => {
        const wrapper = mountWithAppServerContext(
            <ProjectDataTypeSelections
                api={API}
                entityDataTypes={[SampleTypeDataType, AssayRunDataType]}
                project={TEST_FOLDER_CONTAINER}
            />
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('button').text()).toBe('Save');
        expect(wrapper.find('.project-datatype-col')).toHaveLength(2);
    });
});
