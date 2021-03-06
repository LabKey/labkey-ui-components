import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Alert } from '../base/Alert';

import { ConceptPathDisplay, ConceptPathDisplayImpl } from './ConceptPath';

import { PathModel } from './models';

const TEST_CONCEPT_PATH = new PathModel();

describe('ConceptPathDisplay', () => {
    test('Path not set', () => {
        const wrapper = mount(<ConceptPathDisplay path={undefined} />);
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find(Alert).text()).toBe('');
        expect(wrapper.find(ConceptPathDisplayImpl)).toHaveLength(0);
        wrapper.unmount();
    });
});

describe('ConceptPathDisplayImpl', () => {
    function validate(
        wrapper: ReactWrapper,
        path: PathModel = undefined,
        parentCount = 0,
        title: string = undefined,
        isCollapsed = false,
        isSelected = false
    ): void {
        expect(wrapper.find('.concept-path-container')).toHaveLength(path ? 1 : 0);
        expect(wrapper.find('.concept-path')).toHaveLength(path ? 1 : 0);
        expect(wrapper.find('.collapsed')).toHaveLength(isCollapsed ? 1 : 0);
        expect(wrapper.find('.selected')).toHaveLength(isSelected ? 1 : 0);
        expect(wrapper.find('.concept-path-label')).toHaveLength(parentCount);
        expect(wrapper.find('i')).toHaveLength(parentCount === 0 ? 0 : parentCount - 1);
        expect(wrapper.find('.title')).toHaveLength(title ? 1 : 0);

        if (title) {
            expect(wrapper.find('.title').text()).toBe(title);
        }
    }

    test('No path loaded', () => {
        const wrapper = mount(<ConceptPathDisplayImpl path={undefined} parentPaths={undefined} />);
        validate(wrapper);
    });

    test('Parent path not loaded yet', () => {
        const wrapper = mount(<ConceptPathDisplayImpl path={TEST_CONCEPT_PATH} parentPaths={undefined} />);
        validate(wrapper, TEST_CONCEPT_PATH);
    });

    test('Parent path empty', () => {
        const parentPaths = [];
        const wrapper = mount(<ConceptPathDisplayImpl path={TEST_CONCEPT_PATH} parentPaths={parentPaths} />);
        validate(wrapper, TEST_CONCEPT_PATH, parentPaths.length);
    });

    test('Parent path set', () => {
        const pathModel1 = new PathModel({
            label: 'first',
        });

        const parentPaths = [pathModel1];
        const wrapper = mount(<ConceptPathDisplayImpl path={TEST_CONCEPT_PATH} parentPaths={parentPaths} />);
        validate(wrapper, TEST_CONCEPT_PATH, parentPaths.length);

        expect(wrapper.find('.concept-path-label').at(0).text()).toBe('first');
    });

    test('Parent path set', () => {
        const pathModel1 = new PathModel({
            label: 'first',
        });

        const pathModel2 = new PathModel({
            label: 'second',
        });

        const pathModel3 = new PathModel({
            label: 'third',
        });

        const parentPaths = [pathModel1, pathModel2, pathModel3];
        const wrapper = mount(<ConceptPathDisplayImpl path={TEST_CONCEPT_PATH} parentPaths={parentPaths} />);
        validate(wrapper, TEST_CONCEPT_PATH, parentPaths.length);

        expect(wrapper.find('.concept-path-label').at(0).text()).toBe('first');
        expect(wrapper.find('.concept-path-label').at(1).text()).toBe('second');
        expect(wrapper.find('.concept-path-label').at(2).text()).toBe('third');
    });

    test('Title set', () => {
        const parentPaths = [];
        const title = 'Long title to show';
        const wrapper = mount(
            <ConceptPathDisplayImpl path={TEST_CONCEPT_PATH} parentPaths={parentPaths} title={title} />
        );
        validate(wrapper, TEST_CONCEPT_PATH, parentPaths.length, title);
    });

    test('Collapsed set', () => {
        const parentPaths = [];
        const title = 'Long title to show';
        const collapsed = true;
        const selected = false;
        const wrapper = mount(
            <ConceptPathDisplayImpl
                path={TEST_CONCEPT_PATH}
                parentPaths={parentPaths}
                title={title}
                isCollapsed={collapsed}
                isSelected={selected}
            />
        );
        validate(wrapper, TEST_CONCEPT_PATH, parentPaths.length, title, collapsed, selected);
    });

    test('Selected set', () => {
        const parentPaths = [];
        const title = 'Long title to show';
        const collapsed = false;
        const selected = true;
        const wrapper = mount(
            <ConceptPathDisplayImpl
                path={TEST_CONCEPT_PATH}
                parentPaths={parentPaths}
                title={title}
                isCollapsed={collapsed}
                isSelected={selected}
            />
        );
        validate(wrapper, TEST_CONCEPT_PATH, parentPaths.length, title, collapsed, selected);
    });
});
