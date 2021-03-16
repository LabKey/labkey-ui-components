import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Alert } from '../base/Alert';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { PathModel } from './models';
import { AlternatePathPanel, ConceptPathInfo, ConceptPathInfoImpl } from './ConceptPathInfo';

import { ConceptPathDisplay } from './ConceptPathDisplay';

describe('ConceptPathInfo', () => {
    test('Nothing set', () => {
        const wrapper = mount(<ConceptPathInfo alternatePathClickHandler={jest.fn} />);
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find(Alert).text()).toBe('');
        expect(wrapper.find(ConceptPathInfoImpl)).toHaveLength(1);
        expect(wrapper.find(ConceptPathInfoImpl).prop('selectedCode')).toBe(undefined);
        expect(wrapper.find(ConceptPathInfoImpl).prop('alternatePaths')).toBe(undefined);
        wrapper.unmount();
    });
});

describe('ConceptPathInfoImpl', () => {
    function validate(
        wrapper: ReactWrapper,
        code: string = undefined,
        loadingCount = 0,
        alternatePaths: PathModel[] = undefined,
        selectedPath: PathModel = undefined
    ): void {
        expect(wrapper.find('.none-selected')).toHaveLength(code ? 0 : 1);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(loadingCount);
        expect(wrapper.find(ConceptPathDisplay)).toHaveLength(alternatePaths?.length ? alternatePaths.length : 0);
        expect(wrapper.find('.current-path-container')).toHaveLength(
            alternatePaths?.length > 0 && selectedPath ? 1 : 0
        );
        expect(wrapper.find('.current-path-container')?.find(ConceptPathDisplay)).toHaveLength(
            alternatePaths?.length > 0 && selectedPath ? 1 : 0
        );
        expect(wrapper.find('.current-path-container')?.find('.selected')).toHaveLength(
            alternatePaths?.length > 0 && selectedPath ? 1 : 0
        );
        expect(wrapper.find('.alternate-paths-container')).toHaveLength(alternatePaths?.length > 0 ? 1 : 0);
        expect(wrapper.find('.alternate-paths-container')?.find(ConceptPathDisplay)).toHaveLength(
            alternatePaths?.length > 0 ? alternatePaths.length - 1 : 0
        );
        expect(wrapper.find('.no-path-info')).toHaveLength(alternatePaths?.length <= 1 ? 1 : 0);
    }

    test('Nothing set', () => {
        const wrapper = mount(<ConceptPathInfoImpl selectedCode={undefined} alternatePathClickHandler={jest.fn} />);
        expect(wrapper.find('.none-selected')).toHaveLength(1);
        expect(wrapper.find('.none-selected').text()).toBe('No concept selected');
        expect(wrapper.find('.concept-pathinfo-container')).toHaveLength(0);
        expect(wrapper.find(ConceptPathDisplay)).toHaveLength(0);
        wrapper.unmount();
    });

    test('Code set, aka Loading', () => {
        const code = 'MagicCode';
        const wrapper = mount(<ConceptPathInfoImpl selectedCode={code} alternatePathClickHandler={jest.fn} />);
        validate(wrapper, code, 1);
        wrapper.unmount();
    });

    test('Loading, Selected path set, alternate paths undefined', () => {
        const code = 'MagicCode';
        const path = new PathModel({
            path: 'abcd/efg/',
            label: 'first',
        });
        const alternatePaths = undefined;
        const wrapper = mount(
            <ConceptPathInfoImpl
                selectedCode={code}
                selectedPath={path}
                alternatePaths={alternatePaths}
                alternatePathClickHandler={jest.fn}
            />
        );
        validate(wrapper, code, 1, alternatePaths, path);
        wrapper.unmount();
    });

    /**
     *  NOTE: this scenario should be impossible in reality as selectedPath should always be included in the alternatePaths set
     */
    test('Selected path set, alternate paths empty', () => {
        const code = 'MagicCode';
        const path = new PathModel({
            path: 'abcd/efg/',
            label: 'first',
        });
        const alternatePaths = [];
        const wrapper = mount(
            <ConceptPathInfoImpl
                selectedCode={code}
                selectedPath={path}
                alternatePaths={alternatePaths}
                alternatePathClickHandler={jest.fn}
            />
        );
        validate(wrapper, code, 0, alternatePaths, path);
        wrapper.unmount();
    });

    test('Only selected path', () => {
        const code = 'MagicCode';
        const path = new PathModel({
            path: 'abcd/efg/',
            label: 'first',
        });
        const alternatePaths = [path];
        const wrapper = mount(
            <ConceptPathInfoImpl
                selectedCode={code}
                selectedPath={path}
                alternatePaths={alternatePaths}
                alternatePathClickHandler={jest.fn}
            />
        );
        validate(wrapper, code, 1, alternatePaths, path);
        wrapper.unmount();
    });

    test('Selected path, and alternate paths', () => {
        const code = 'MagicCode';
        const path1 = new PathModel({
            path: 'abcd/efg/',
            label: 'first',
        });

        const path2 = new PathModel({
            path: '1234/efg/',
            label: 'second',
        });
        const path3 = new PathModel({
            path: 'abcd/efg/123',
            label: 'third',
        });
        const path4 = new PathModel({
            path: 'abcd/efg/4',
            label: 'fourth',
        });
        const selected = path3;
        const alternatePaths = [path1, path2, path3, path4];
        const wrapper = mount(
            <ConceptPathInfoImpl
                selectedCode={code}
                selectedPath={selected}
                alternatePaths={alternatePaths}
                alternatePathClickHandler={jest.fn}
            />
        );
        validate(wrapper, code, 4, alternatePaths, selected);
        wrapper.unmount();
    });
});

describe('AlternatePathPanel', () => {
    const TEST_SELECTED_PATH = new PathModel({ code: 'a', label: 'A', path: 'a/a'});
    const TEST_ALTERNATE_PATH = new PathModel({ code: 'a', label: 'A', path: 'b/a'});

    function validate(wrapper: ReactWrapper, hasSelectedPath = false, alternatePathCount = 0): void {
        expect(wrapper.find('.current-path-container')).toHaveLength(hasSelectedPath ? 1 : 0);
        expect(wrapper.find('.alternate-paths-container')).toHaveLength(1);
        expect(wrapper.find('.no-path-info')).toHaveLength(alternatePathCount === 0 ? 1 : 0);
        expect(wrapper.find('.title')).toHaveLength(1 + (hasSelectedPath ? 1 : 0));
        expect(wrapper.find(ConceptPathDisplay)).toHaveLength(alternatePathCount + (hasSelectedPath ? 1 : 0));
    }

    test('no paths', () => {
        const wrapper = mount(
            <AlternatePathPanel selectedPath={undefined} alternatePaths={[]} alternatePathClickHandler={jest.fn} />
        );
        validate(wrapper);
        wrapper.unmount();
    });

    test('with selected path but no alternates', () => {
        const wrapper = mount(
            <AlternatePathPanel
                selectedPath={TEST_SELECTED_PATH}
                alternatePaths={[TEST_SELECTED_PATH]}
                alternatePathClickHandler={jest.fn}
            />
        );
        validate(wrapper, true);
        expect(wrapper.find(ConceptPathDisplay).prop('path')).toBe(TEST_SELECTED_PATH);
        expect(wrapper.find(ConceptPathDisplay).prop('isSelected')).toBe(true);
        wrapper.unmount();
    });

    test('with selected path and alternate', () => {
        const wrapper = mount(
            <AlternatePathPanel
                selectedPath={TEST_SELECTED_PATH}
                alternatePaths={[TEST_SELECTED_PATH, TEST_ALTERNATE_PATH]}
                alternatePathClickHandler={jest.fn}
            />
        );
        validate(wrapper, true, 1);
        expect(wrapper.find(ConceptPathDisplay).first().prop('path')).toBe(TEST_SELECTED_PATH);
        expect(wrapper.find(ConceptPathDisplay).first().prop('isSelected')).toBe(true);
        expect(wrapper.find(ConceptPathDisplay).first().prop('onClick')).toBeUndefined();
        expect(wrapper.find(ConceptPathDisplay).last().prop('path')).toBe(TEST_ALTERNATE_PATH);
        expect(wrapper.find(ConceptPathDisplay).last().prop('isSelected')).toBeUndefined();
        expect(wrapper.find(ConceptPathDisplay).last().prop('onClick')).toBeDefined();
        wrapper.unmount();
    });

    test('with no selected path and alternates', () => {
        const wrapper = mount(
            <AlternatePathPanel
                selectedPath={undefined}
                alternatePaths={[TEST_SELECTED_PATH, TEST_ALTERNATE_PATH]}
                alternatePathClickHandler={jest.fn}
            />
        );
        validate(wrapper, false, 2);
        expect(wrapper.find(ConceptPathDisplay).first().prop('path')).toBe(TEST_SELECTED_PATH);
        expect(wrapper.find(ConceptPathDisplay).first().prop('isSelected')).toBeUndefined();
        expect(wrapper.find(ConceptPathDisplay).first().prop('onClick')).toBeDefined();
        expect(wrapper.find(ConceptPathDisplay).last().prop('path')).toBe(TEST_ALTERNATE_PATH);
        expect(wrapper.find(ConceptPathDisplay).last().prop('isSelected')).toBeUndefined();
        expect(wrapper.find(ConceptPathDisplay).last().prop('onClick')).toBeDefined();
        wrapper.unmount();
    });
});
