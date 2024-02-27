import React from 'react';
import { act } from '@testing-library/react';

import { AssayRunDataType, SampleTypeDataType } from '../entities/constants';

import { TEST_FOLDER_CONTAINER } from '../../containerFixtures';

import { getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { ProjectDataTypeSelections } from './ProjectDataTypeSelections';

describe('ProjectDataTypeSelections', () => {
    beforeAll(() => {
        global.console.error = jest.fn();
    });

    const API = getFolderTestAPIWrapper(jest.fn, {
        getFolderDataTypeExclusions: jest.fn().mockResolvedValue({}),
    });

    test('without selected project - new project', async () => {
        await act(async () => {
            renderWithAppContext(<ProjectDataTypeSelections
                api={API}
                entityDataTypes={[SampleTypeDataType]}
                getIsDirty={jest.fn()}
                setIsDirty={jest.fn()}
                updateDataTypeExclusions={jest.fn()}
            />);
        });
        expect(document.querySelectorAll('button')).toHaveLength(0);
    });

    test('with project', async () => {
        await act(async () => {
            renderWithAppContext(
                <ProjectDataTypeSelections
                    api={API}
                    entityDataTypes={[SampleTypeDataType]}
                    project={TEST_FOLDER_CONTAINER}
                    getIsDirty={jest.fn()}
                    setIsDirty={jest.fn()}
                    updateDataTypeExclusions={jest.fn()}
                />
            );
        });
        expect(document.querySelectorAll('button')).toHaveLength(1);
        expect(document.querySelector('button').textContent).toBe('Save');
        expect(document.querySelectorAll('.project-datatype-col')).toHaveLength(1);
    });

    test('with 2 entityDataTypes', async () => {
        await act(async () => {
            renderWithAppContext(
                <ProjectDataTypeSelections
                    api={API}
                    entityDataTypes={[SampleTypeDataType, AssayRunDataType]}
                    project={TEST_FOLDER_CONTAINER}
                    getIsDirty={jest.fn()}
                    setIsDirty={jest.fn()}
                    updateDataTypeExclusions={jest.fn()}
                />
            );
        });
        expect(document.querySelectorAll('button')).toHaveLength(1);
        expect(document.querySelector('button').textContent).toBe('Save');
        expect(document.querySelectorAll('.project-datatype-col')).toHaveLength(2);
    });
});
