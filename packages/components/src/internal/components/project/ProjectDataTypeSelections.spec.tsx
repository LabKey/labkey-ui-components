import React from 'react';
import { Col } from 'react-bootstrap';

import { mountWithAppServerContext } from '../../test/enzymeTestHelpers';

import { AssayRunDataType, SampleTypeDataType } from '../entities/constants';

import { TEST_FOLDER_CONTAINER } from '../../containerFixtures';

import { ProjectDataTypeSelections } from './ProjectDataTypeSelections';

describe('ProjectDataTypeSelections', () => {
    test('without selected project - new project', () => {
        const wrapper = mountWithAppServerContext(<ProjectDataTypeSelections entityDataTypes={[SampleTypeDataType]} />);
        expect(wrapper.find('button')).toHaveLength(0);
    });

    test('with project', () => {
        const wrapper = mountWithAppServerContext(
            <ProjectDataTypeSelections entityDataTypes={[SampleTypeDataType]} project={TEST_FOLDER_CONTAINER} />
        );
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('button').text()).toBe('Save');
        expect(wrapper.find(Col)).toHaveLength(1);
    });

    test('with 2 entityDataTypes', () => {
        const wrapper = mountWithAppServerContext(
            <ProjectDataTypeSelections
                entityDataTypes={[SampleTypeDataType, AssayRunDataType]}
                project={TEST_FOLDER_CONTAINER}
            />
        );
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('button').text()).toBe('Save');
        expect(wrapper.find(Col)).toHaveLength(2);
    });
});
