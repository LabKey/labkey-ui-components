import React from 'react';
import { Button, Col } from 'react-bootstrap';

import { mountWithAppServerContext } from '../../enzymeTestHelpers';

import { AssayRunDataType, SampleTypeDataType } from '../entities/constants';

import { ProjectDataTypeSelections } from './ProjectDataTypeSelections';

describe('ProjectDataTypeSelections', () => {
    test('without project Id - new project', () => {
        const wrapper = mountWithAppServerContext(<ProjectDataTypeSelections entityDataTypes={[SampleTypeDataType]} />);
        expect(wrapper.find(Button)).toHaveLength(0);
    });

    test('with project Id', () => {
        const wrapper = mountWithAppServerContext(
            <ProjectDataTypeSelections entityDataTypes={[SampleTypeDataType]} projectId="123" />
        );
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find(Button).text()).toBe('Save');
        expect(wrapper.find(Col)).toHaveLength(1);
    });

    test('with 2 entityDataTypes', () => {
        const wrapper = mountWithAppServerContext(
            <ProjectDataTypeSelections entityDataTypes={[SampleTypeDataType, AssayRunDataType]} projectId="123" />
        );
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find(Button).text()).toBe('Save');
        expect(wrapper.find(Col)).toHaveLength(2);
    });
});
