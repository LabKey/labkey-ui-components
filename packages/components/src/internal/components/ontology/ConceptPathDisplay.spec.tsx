import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Alert } from '../base/Alert';

import { ConceptPathDisplay, ConceptPathDisplayImpl } from './ConceptPathDisplay';

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

    test('Path set', () => {
        const wrapper = mount(<ConceptPathDisplay path={TEST_CONCEPT_PATH} title={'test title'} isSelected={true} />);
        expect(wrapper.find(ConceptPathDisplayImpl)).toHaveLength(1);
        expect(wrapper.find(ConceptPathDisplayImpl).prop('path')).toBe(TEST_CONCEPT_PATH);
        expect(wrapper.find(ConceptPathDisplayImpl).prop('title')).toBe('test title');
        expect(wrapper.find(ConceptPathDisplayImpl).prop('isSelected')).toBe(true);
        expect(wrapper.find(ConceptPathDisplayImpl).prop('parentPaths')).toBe(undefined);
        wrapper.unmount();
    });
});

describe('ConceptPathDisplayImpl', () => {
    function validate(
        wrapper: ReactWrapper,
        path: PathModel = undefined,
        parentCount = 0,
        title: string = undefined,
        isSelected = false,
        isLoading = false
    ): void {
        expect(wrapper.find('.concept-path-container')).toHaveLength(path ? 1 : 0);
        expect(wrapper.find('.concept-path')).toHaveLength(path ? 1 : 0);
        expect(wrapper.find('.selected')).toHaveLength(isSelected ? 1 : 0);
        expect(wrapper.find('.concept-path-label')).toHaveLength(parentCount);
        expect(wrapper.find('i')).toHaveLength(parentCount === 0 ? (isLoading ? 1 : 0) : parentCount - 1);
        expect(wrapper.find('.concept-path-spacer')).toHaveLength(parentCount > 0 ? parentCount - 1 : 0);
        expect(wrapper.find('.title')).toHaveLength(title ? 1 : 0);

        if (title) {
            expect(wrapper.find('.title').text()).toBe(title);
        }
    }

    test('No path loaded', () => {
        const wrapper = mount(<ConceptPathDisplayImpl path={undefined} parentPaths={undefined} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('Parent path not loaded yet', () => {
        const wrapper = mount(<ConceptPathDisplayImpl path={TEST_CONCEPT_PATH} parentPaths={undefined} />);
        validate(wrapper, TEST_CONCEPT_PATH, 0, undefined, false, true);
        wrapper.unmount();
    });

    test('Parent path empty', () => {
        const parentPaths = [];
        const wrapper = mount(<ConceptPathDisplayImpl path={TEST_CONCEPT_PATH} parentPaths={parentPaths} />);
        validate(wrapper, TEST_CONCEPT_PATH, parentPaths.length);
        wrapper.unmount();
    });

    test('Parent path set', () => {
        const pathModel1 = new PathModel({
            label: 'first',
        });

        const parentPaths = [pathModel1];
        const wrapper = mount(<ConceptPathDisplayImpl path={TEST_CONCEPT_PATH} parentPaths={parentPaths} />);
        validate(wrapper, TEST_CONCEPT_PATH, parentPaths.length);

        expect(wrapper.find('.concept-path-label').at(0).text()).toBe('first');
        wrapper.unmount();
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
        wrapper.unmount();
    });

    test('Title set', () => {
        const parentPaths = [];
        const title = 'Long title to show';
        const wrapper = mount(
            <ConceptPathDisplayImpl path={TEST_CONCEPT_PATH} parentPaths={parentPaths} title={title} />
        );
        validate(wrapper, TEST_CONCEPT_PATH, parentPaths.length, title);
        wrapper.unmount();
    });

    test('Selected set', () => {
        const parentPaths = [];
        const title = 'Long title to show';
        const selected = true;
        const wrapper = mount(
            <ConceptPathDisplayImpl
                path={TEST_CONCEPT_PATH}
                parentPaths={parentPaths}
                title={title}
                isSelected={selected}
            />
        );
        validate(wrapper, TEST_CONCEPT_PATH, parentPaths.length, title, selected);
        wrapper.unmount();
    });
});
