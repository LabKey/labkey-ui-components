import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { ChoicesListItem } from '../base/ChoicesListItem';

import { waitForLifecycle } from '../../test/enzymeTestHelpers';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { AddEntityButton } from '../buttons/AddEntityButton';

import { TextChoiceOptionsImpl } from './TextChoiceOptions';
import { DomainField } from './models';
import { SectionHeading } from './SectionHeading';
import { DomainFieldLabel } from './DomainFieldLabel';

describe('TextChoiceOptions', () => {
    const DEFAULT_PROPS = {
        label: 'Test Label',
        field: DomainField.create({}),
        fieldValues: {},
        loading: false,
        replaceValues: jest.fn,
        validValues: [],
        index: 0,
        domainIndex: 0,
        onChange: jest.fn,
        lockType: undefined,
    };

    function validate(
        wrapper: ReactWrapper,
        isLoading = false,
        validValues = 0,
        inUse = 0,
        hasSelection = false,
        hasValueUpdate = false,
        hasValueError = false
    ): void {
        expect(wrapper.find(SectionHeading)).toHaveLength(1);
        expect(wrapper.find(SectionHeading).prop('title')).toBe('Test Label');
        expect(wrapper.find(DomainFieldLabel)).toHaveLength(hasSelection ? 2 : 1);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(isLoading ? 1 : 0);

        expect(wrapper.find('.domain-text-choices-list')).toHaveLength(!isLoading ? 1 : 0);

        if (!isLoading) {
            expect(wrapper.find('.domain-text-choices-left-panel')).toHaveLength(validValues > 0 ? 1 : 0);
            expect(wrapper.find(ChoicesListItem)).toHaveLength(validValues);
            expect(wrapper.find('.choices-list__locked')).toHaveLength(inUse);
            expect(wrapper.find(AddEntityButton)).toHaveLength(1);
            expect(wrapper.find('.choices-detail__empty-message')).toHaveLength(
                validValues > 0 && !hasSelection ? 1 : 0
            );
            expect(wrapper.find('input.full-width')).toHaveLength(hasSelection ? 1 : 0);
            expect(wrapper.find('button')).toHaveLength(validValues + (hasSelection ? 2 : 0));
            expect(wrapper.find('.domain-text-choices-info').hostNodes()).toHaveLength(hasValueUpdate ? 1 : 0);
            expect(wrapper.find('.alert-danger')).toHaveLength(hasValueError ? 1 : 0);
            expect(wrapper.find('input.domain-text-choices-search')).toHaveLength(validValues > 2 ? 1 : 0);
        }
    }

    test('default props', () => {
        const wrapper = mount(<TextChoiceOptionsImpl {...DEFAULT_PROPS} />);
        validate(wrapper);
        expect(wrapper.find(AddEntityButton).prop('disabled')).toBeFalsy();
        wrapper.unmount();
    });

    test('loading', () => {
        const wrapper = mount(<TextChoiceOptionsImpl {...DEFAULT_PROPS} loading />);
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('with validValues, no selection', () => {
        const wrapper = mount(<TextChoiceOptionsImpl {...DEFAULT_PROPS} validValues={['a', 'b']} />);
        validate(wrapper, false, 2);
        expect(wrapper.find(ChoicesListItem).first().prop('active')).toBeFalsy();
        wrapper.unmount();
    });

    test('with validValues, with selection', async () => {
        const wrapper = mount(<TextChoiceOptionsImpl {...DEFAULT_PROPS} validValues={['a', 'b']} />);
        wrapper.find(ChoicesListItem).first().simulate('click');
        await waitForLifecycle(wrapper);
        validate(wrapper, false, 2, 0, true);
        expect(wrapper.find(ChoicesListItem).first().prop('active')).toBeTruthy();
        wrapper.unmount();
    });

    test('apply button disabled', async () => {
        const wrapper = mount(<TextChoiceOptionsImpl {...DEFAULT_PROPS} validValues={['a', 'b']} />);
        wrapper.find(ChoicesListItem).first().simulate('click');
        await waitForLifecycle(wrapper);

        expect(wrapper.find('input.full-width').prop('value')).toBe('a');
        expect(wrapper.find('input.full-width').prop('disabled')).toBeFalsy();
        expect(wrapper.find('.btn-success').prop('disabled')).toBeTruthy();

        wrapper.find('input.full-width').simulate('change', { target: { name: 'value', value: 'aa' } });
        await waitForLifecycle(wrapper);
        expect(wrapper.find('input.full-width').prop('value')).toBe('aa');
        expect(wrapper.find('.btn-success').prop('disabled')).toBeFalsy();

        wrapper.unmount();
    });

    test('choice item empty', async () => {
        const wrapper = mount(<TextChoiceOptionsImpl {...DEFAULT_PROPS} validValues={['a', 'b']} />);
        expect(wrapper.find(ChoicesListItem).first().prop('label')).toBe('a');
        expect(wrapper.find(ChoicesListItem).first().prop('subLabel')).toBe(undefined);
        expect(wrapper.find(ChoicesListItem).last().prop('label')).toBe('b');
        expect(wrapper.find(ChoicesListItem).last().prop('subLabel')).toBe(undefined);

        wrapper.setProps({
            validValues: ['', 'b'],
        });
        await waitForLifecycle(wrapper);

        expect(wrapper.find(ChoicesListItem).first().prop('label')).toBe('');
        expect(wrapper.find(ChoicesListItem).first().prop('subLabel')).toBe('Empty Value');
        expect(wrapper.find(ChoicesListItem).last().prop('label')).toBe('b');
        expect(wrapper.find(ChoicesListItem).last().prop('subLabel')).toBe(undefined);

        wrapper.unmount();
    });

    test('with inUse values', async () => {
        const wrapper = mount(
            <TextChoiceOptionsImpl
                {...DEFAULT_PROPS}
                validValues={['a', 'b']}
                fieldValues={{ b: { locked: false, count: 1 } }}
            />
        );
        validate(wrapper, false, 2, 1);

        // select the in-use value and check right hand items
        wrapper.find(ChoicesListItem).last().simulate('click');
        await waitForLifecycle(wrapper);
        validate(wrapper, false, 2, 1, true);
        expect(wrapper.find('input.full-width').prop('disabled')).toBeFalsy();

        wrapper.unmount();
    });

    test('with inUse value update info', async () => {
        const wrapper = mount(
            <TextChoiceOptionsImpl
                {...DEFAULT_PROPS}
                validValues={['a', 'b']}
                fieldValues={{ b: { locked: false, count: 1 } }}
            />
        );
        validate(wrapper, false, 2, 1);

        // select the in-use value, change it, and apply
        wrapper.find(ChoicesListItem).last().simulate('click');
        await waitForLifecycle(wrapper);
        wrapper.find('input.full-width').simulate('change', { target: { name: 'value', value: 'bb' } });
        await waitForLifecycle(wrapper);
        wrapper.find('.btn-success').simulate('click');
        await waitForLifecycle(wrapper);
        wrapper.setProps({ validValues: ['a', 'bb'] });
        await waitForLifecycle(wrapper);

        validate(wrapper, false, 2, 1, true, true);
        expect(wrapper.find('.domain-text-choices-info').hostNodes().text()).toBe(
            '1 row with value b will be updated to bb on save.'
        );

        wrapper.unmount();
    });

    test('with locked values', async () => {
        const wrapper = mount(
            <TextChoiceOptionsImpl
                {...DEFAULT_PROPS}
                validValues={['a', 'b']}
                fieldValues={{ b: { locked: true, count: 1 } }}
            />
        );
        validate(wrapper, false, 2, 1);

        // select the locked value and check right hand items
        wrapper.find(ChoicesListItem).last().simulate('click');
        await waitForLifecycle(wrapper);
        validate(wrapper, false, 2, 1, true);
        expect(wrapper.find('input.full-width').prop('disabled')).toBeTruthy();

        wrapper.unmount();
    });

    test('value update error checks', async () => {
        const wrapper = mount(<TextChoiceOptionsImpl {...DEFAULT_PROPS} validValues={['a', 'b']} />);

        wrapper.find(ChoicesListItem).last().simulate('click');
        await waitForLifecycle(wrapper);
        validate(wrapper, false, 2, 0, true);

        // don't allow empty string
        wrapper.find('input.full-width').simulate('change', { target: { name: 'value', value: 'bb' } });
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.btn-success').prop('disabled')).toBeFalsy();
        wrapper.find('input.full-width').simulate('change', { target: { name: 'value', value: '   ' } });
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.btn-success').prop('disabled')).toBeTruthy();

        // don't allow duplicates
        wrapper.find('input.full-width').simulate('change', { target: { name: 'value', value: ' a ' } });
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.btn-success').prop('disabled')).toBeTruthy();
        validate(wrapper, false, 2, 0, true, false, true);
        expect(wrapper.find('.alert-danger').text()).toBe('"a" already exists in the list of values.');

        wrapper.unmount();
    });

    test('delete button disabled', async () => {
        const wrapper = mount(
            <TextChoiceOptionsImpl
                {...DEFAULT_PROPS}
                validValues={['a', 'b']}
                fieldValues={{ b: { locked: false, count: 1 } }}
            />
        );
        validate(wrapper, false, 2, 1);

        // first value, not in use
        wrapper.find(ChoicesListItem).first().simulate('click');
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.btn-default').last().prop('disabled')).toBeFalsy();

        // second value, in use
        wrapper.find(ChoicesListItem).last().simulate('click');
        await waitForLifecycle(wrapper);
        expect(wrapper.find('.btn-default').last().prop('disabled')).toBeTruthy();

        wrapper.unmount();
    });

    test('AddEntityButton disabled if max reached', () => {
        const wrapper = mount(<TextChoiceOptionsImpl {...DEFAULT_PROPS} maxValueCount={2} validValues={['a', 'b']} />);
        validate(wrapper, false, 2);
        expect(wrapper.find(AddEntityButton).prop('disabled')).toBeTruthy();
        wrapper.unmount();
    });

    test('search', async () => {
        const wrapper = mount(<TextChoiceOptionsImpl {...DEFAULT_PROPS} validValues={['a', 'aa', 'aaa', 'b']} />);
        validate(wrapper, false, 4);
        wrapper
            .find('input.domain-text-choices-search')
            .simulate('change', { target: { name: 'value', value: ' a ' } });
        await waitForLifecycle(wrapper);
        let values = wrapper.find(ChoicesListItem);
        expect(values).toHaveLength(3);
        expect(values.at(0).text()).toBe('a');
        expect(values.at(1).text()).toBe('aa');
        expect(values.at(2).text()).toBe('aaa');
        wrapper.find('input.domain-text-choices-search').simulate('change', { target: { name: 'value', value: 'b' } });
        await waitForLifecycle(wrapper);
        values = wrapper.find(ChoicesListItem);
        expect(values).toHaveLength(1);
        expect(values.at(0).text()).toBe('b');
        wrapper.find('input.domain-text-choices-search').simulate('change', { target: { name: 'value', value: 'AA' } });
        await waitForLifecycle(wrapper);
        values = wrapper.find(ChoicesListItem);
        expect(values).toHaveLength(2);
        expect(values.at(0).text()).toBe('aa');
        expect(values.at(1).text()).toBe('aaa');
        wrapper.find('input.domain-text-choices-search').simulate('change', { target: { name: 'value', value: '' } });
        await waitForLifecycle(wrapper);
        values = wrapper.find(ChoicesListItem);
        expect(values).toHaveLength(4);
        expect(values.at(0).text()).toBe('a');
        expect(values.at(1).text()).toBe('aa');
        expect(values.at(2).text()).toBe('aaa');
        expect(values.at(3).text()).toBe('b');
        wrapper.unmount();
    });
});
