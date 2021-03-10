import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Alert } from '../base/Alert';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { PathModel } from './models';
import { ConceptPathInfo, ConceptPathInfoImpl } from './ConceptPathInfo';

import { ConceptPathDisplay } from './ConceptPath';

describe('ConceptPathInfo', () => {
    test('Nothing set', () => {
        const wrapper = mount(<ConceptPathInfo />);
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find(Alert).text()).toBe('');
        expect(wrapper.find(ConceptPathInfoImpl)).toHaveLength(1);
        wrapper.unmount();
    });
});

describe('ConceptPathInfoImpl', () => {
    function validate(
        wrapper: ReactWrapper,
        code: string = undefined,
        isLoading = false,
        alternatePaths: PathModel[] = undefined,
        selectedPath: PathModel = undefined
    ): void {
        expect(wrapper.find('.none-selected')).toHaveLength(code ? 0 : 1);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(isLoading ? 1 : 0);
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
        expect(wrapper.find('.no-path-info')).toHaveLength(alternatePaths?.length === 0 ? 1 : 0);
    }

    test('Nothing set', () => {
        const wrapper = mount(<ConceptPathInfoImpl selectedCode={undefined} />);
        expect(wrapper.find('.none-selected')).toHaveLength(1);
        expect(wrapper.find('.none-selected').text()).toBe('No concept selected');
        expect(wrapper.find('.concept-pathinfo-container')).toHaveLength(0);
        expect(wrapper.find(ConceptPathDisplay)).toHaveLength(0);
        wrapper.unmount();
    });

    test('Code set, aka Loading', () => {
        const code = 'MagicCode';
        const wrapper = mount(<ConceptPathInfoImpl selectedCode={code} />);
        validate(wrapper, code, true);
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
            <ConceptPathInfoImpl selectedCode={code} selectedPath={path} alternatePaths={alternatePaths} />
        );
        validate(wrapper, code, true, alternatePaths, path);
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
            <ConceptPathInfoImpl selectedCode={code} selectedPath={path} alternatePaths={alternatePaths} />
        );
        validate(wrapper, code, false, alternatePaths, path);
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
            <ConceptPathInfoImpl selectedCode={code} selectedPath={path} alternatePaths={alternatePaths} />
        );
        validate(wrapper, code, false, alternatePaths, path);
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
            <ConceptPathInfoImpl selectedCode={code} selectedPath={selected} alternatePaths={alternatePaths} />
        );
        validate(wrapper, code, false, alternatePaths, selected);
        wrapper.unmount();
    });
});
