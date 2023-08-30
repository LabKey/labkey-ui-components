import React from 'react';
import { mount } from 'enzyme';

import { LoadingState } from '../../../public/LoadingState';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { PaginationInfo, PaginationInfoProps } from './PaginationInfo';

describe('PaginationInfo', () => {
    function getDefaultProps(): PaginationInfoProps {
        return {
            offset: 0,
            pageSize: 20,
            rowCount: 1,
            totalCountLoadingState: LoadingState.LOADED,
        };
    }

    test('loading', () => {
        const wrapper = mount(<PaginationInfo {...getDefaultProps()} totalCountLoadingState={LoadingState.LOADING} />);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
        expect(wrapper.find('.pagination-info')).toHaveLength(1);
        expect(wrapper.find('.pagination-info').text()).toBe('1 -  ');
        wrapper.unmount();
    });

    test('rowCount greater than maxRows', () => {
        const wrapper = mount(<PaginationInfo {...getDefaultProps()} rowCount={22} />);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.find('.pagination-info')).toHaveLength(1);
        expect(wrapper.find('.pagination-info').text()).toBe('1 - 20 of 22');
        wrapper.unmount();
    });

    test('offset', () => {
        const wrapper = mount(<PaginationInfo {...getDefaultProps()} rowCount={22} offset={20} />);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.find('.pagination-info')).toHaveLength(1);
        expect(wrapper.find('.pagination-info').text()).toBe('21 - 22');
        wrapper.unmount();
    });

    test('lots of rows, very large page', () => {
        const wrapper = mount(<PaginationInfo {...getDefaultProps()} pageSize={3412} rowCount={22341} />);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.find('.pagination-info')).toHaveLength(1);
        expect(wrapper.find('.pagination-info').text()).toBe('1 - 3,412 of 22,341');
        wrapper.unmount();
    });
});
