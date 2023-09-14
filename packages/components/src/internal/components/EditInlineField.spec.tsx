import React from 'react';
import { ReactWrapper } from 'enzyme';

import { mountWithAppServerContext } from '../test/enzymeTestHelpers';

import { QueryColumn } from '../../public/QueryColumn';

import { TEST_USER_EDITOR } from '../userFixtures';

import { EditInlineField } from './EditInlineField';
import { DateInput } from './DateInput';

import { TextChoiceInput } from './forms/input/TextChoiceInput';
import { UserLink } from './user/UserLink';

beforeAll(() => {
    LABKEY.container = {
        formats: {
            dateFormat: 'yyyy-MM-dd',
            dateTimeFormat: 'yyyy-MM-dd HH:mm',
            numberFormat: null,
        },
    };
});

describe('EditInlineField', () => {
    const DEFAULT_PROPS = {
        name: 'name',
        type: 'text',
        value: null,
        allowEdit: true,
        label: 'Test Label',
    };

    const SERVER_CONTEXT = {
        user: TEST_USER_EDITOR,
    };

    function validate(wrapper: ReactWrapper, editing = false, allowEdit = true, type?: Record<string, number>): void {
        expect(wrapper.find('.edit-inline-field__label')).toHaveLength(!editing ? 1 : 0);
        expect(wrapper.find('.edit-inline-field__toggle')).toHaveLength(!editing && allowEdit ? 1 : 0);
        expect(wrapper.find('.fa-pencil')).toHaveLength(!editing && allowEdit ? 1 : 0);
        if (!editing) {
            expect(wrapper.find('.edit-inline-field__label').text()).toBe('Test Label');
        }

        expect(wrapper.find(DateInput)).toHaveLength(type?.date ?? 0);
        expect(wrapper.find('textarea')).toHaveLength(type?.textarea ?? 0);
        expect(wrapper.find('input')).toHaveLength(type?.text ?? type?.date ?? 0);

        expect(wrapper.find(UserLink)).toHaveLength(type?.user ?? 0);
    }

    test('default props', () => {
        const wrapper = mountWithAppServerContext(<EditInlineField {...DEFAULT_PROPS} />, {}, SERVER_CONTEXT);
        validate(wrapper);
        expect(wrapper.find('.edit-inline-field__placeholder').text()).toBe('');
        expect(wrapper.find('.edit-inline-field__toggle').text()).toBe('');
        wrapper.find('.edit-inline-field__toggle').simulate('click');
        validate(wrapper, true, true, { text: 1 });
        wrapper.unmount();
    });

    test('not allowEdit', () => {
        const wrapper = mountWithAppServerContext(
            <EditInlineField {...DEFAULT_PROPS} allowEdit={false} />,
            {},
            SERVER_CONTEXT
        );
        validate(wrapper, false, false);
        wrapper.unmount();
    });

    test('emptyText', () => {
        const wrapper = mountWithAppServerContext(
            <EditInlineField {...DEFAULT_PROPS} emptyText="Test Empty Text" />,
            {},
            SERVER_CONTEXT
        );
        validate(wrapper);
        expect(wrapper.find('.edit-inline-field__placeholder').text()).toBe('Test Empty Text');
        wrapper.unmount();
    });

    test('with value', () => {
        const wrapper = mountWithAppServerContext(
            <EditInlineField {...DEFAULT_PROPS} value="testing value" />,
            {},
            SERVER_CONTEXT
        );
        validate(wrapper);
        expect(wrapper.find('.edit-inline-field__placeholder')).toHaveLength(0);
        expect(wrapper.find('.edit-inline-field__toggle').text()).toBe('testing value');
        wrapper.unmount();
    });

    test('with RowValue, displayValue', () => {
        const wrapper = mountWithAppServerContext(
            <EditInlineField {...DEFAULT_PROPS} value={{ value: 1, displayValue: 'Test1' }} />,
            {},
            SERVER_CONTEXT
        );
        validate(wrapper);
        expect(wrapper.find('.edit-inline-field__placeholder')).toHaveLength(0);
        expect(wrapper.find('.edit-inline-field__toggle').text()).toBe('Test1');
        wrapper.unmount();
    });

    test('with RowValue, formattedValue', () => {
        const wrapper = mountWithAppServerContext(
            <EditInlineField
                {...DEFAULT_PROPS}
                value={{ value: 1, displayValue: 'Test1', formattedValue: 'Test1.0' }}
            />,
            {},
            SERVER_CONTEXT
        );
        validate(wrapper);
        expect(wrapper.find('.edit-inline-field__placeholder')).toHaveLength(0);
        expect(wrapper.find('.edit-inline-field__toggle').text()).toBe('Test1.0');
        wrapper.unmount();
    });

    test('with RowValue, url', () => {
        const wrapper = mountWithAppServerContext(
            <EditInlineField
                {...DEFAULT_PROPS}
                value={{ value: 1, displayValue: 'Test1', url: 'https://www.labkey.org' }}
            />,
            {},
            SERVER_CONTEXT
        );
        validate(wrapper);
        expect(wrapper.find('.edit-inline-field__placeholder')).toHaveLength(0);
        expect(wrapper.find('.edit-inline-field__toggle').text()).toBe('Test1');
        const link = wrapper.find('.edit-inline-field__toggle').find('a');
        expect(link).toHaveLength(1);
        expect(link.prop('href')).toBe('https://www.labkey.org');
        wrapper.unmount();
    });

    test('isTextArea', () => {
        const wrapper = mountWithAppServerContext(
            <EditInlineField {...DEFAULT_PROPS} type="textarea" />,
            {},
            SERVER_CONTEXT
        );
        validate(wrapper);
        wrapper.find('.edit-inline-field__toggle').simulate('click');
        validate(wrapper, true, true, { textarea: 1 });
        wrapper.unmount();
    });

    test('isDate, no initial value', () => {
        const wrapper = mountWithAppServerContext(
            <EditInlineField {...DEFAULT_PROPS} type="date" />,
            {},
            SERVER_CONTEXT
        );
        validate(wrapper);
        expect(wrapper.find('.edit-inline-field__toggle').text()).toBe('');
        wrapper.find('.edit-inline-field__toggle').simulate('click');
        validate(wrapper, true, true, { date: 1 });
        expect(wrapper.find(DateInput).prop('selected')).toBeUndefined();
        expect(wrapper.find(DateInput).prop('showTimeSelect')).toBeFalsy();
        expect(wrapper.find(DateInput).prop('dateFormat')).toBe('yyyy-MM-dd');
        wrapper.unmount();
    });

    test('isDate, with initial value', () => {
        const wrapper = mountWithAppServerContext(
            <EditInlineField {...DEFAULT_PROPS} type="date" value="2022-08-11" />,
            {},
            SERVER_CONTEXT
        );
        validate(wrapper);
        expect(wrapper.find('.edit-inline-field__toggle').text()).toBe('2022-08-11');
        wrapper.find('.edit-inline-field__toggle').simulate('click');
        validate(wrapper, true, true, { date: 1 });
        expect(wrapper.find(DateInput).prop('selected')).toBeDefined();
        expect(wrapper.find(DateInput).prop('showTimeSelect')).toBeFalsy();
        expect(wrapper.find(DateInput).prop('dateFormat')).toBe('yyyy-MM-dd');
        wrapper.unmount();
    });

    test('isDate, with initial value and QueryColumn format', () => {
        const wrapper = mountWithAppServerContext(
            <EditInlineField
                {...DEFAULT_PROPS}
                type="date"
                value="2022-08-11"
                column={new QueryColumn({ format: 'MM/dd/YYYY HH:mm:ss' })}
            />,
            {},
            SERVER_CONTEXT
        );
        validate(wrapper);
        expect(wrapper.find('.edit-inline-field__toggle').text()).toBe('2022-08-11');
        wrapper.find('.edit-inline-field__toggle').simulate('click');
        validate(wrapper, true, true, { date: 1 });
        expect(wrapper.find(DateInput).prop('selected')).toBeDefined();
        expect(wrapper.find(DateInput).prop('showTimeSelect')).toBeTruthy();
        expect(wrapper.find(DateInput).prop('dateFormat')).toBe('MM/dd/yyyy HH:mm:ss');
        wrapper.unmount();
    });

    test('resolveDetailEditRenderer', () => {
        const wrapper = mountWithAppServerContext(
            <EditInlineField
                {...DEFAULT_PROPS}
                column={
                    new QueryColumn({
                        fieldKey: 'test',
                        readOnly: false,
                        userEditable: true,
                        shownInUpdateView: true,
                        validValues: ['a', 'b'],
                    })
                }
            />,
            {},
            SERVER_CONTEXT
        );
        validate(wrapper);
        expect(wrapper.find(TextChoiceInput)).toHaveLength(0);
        expect(wrapper.find('.edit-inline-field__placeholder').text()).toBe('');
        expect(wrapper.find('.edit-inline-field__toggle').text()).toBe('');
        wrapper.find('.edit-inline-field__toggle').simulate('click');
        validate(wrapper, true, true, { text: 2 });
        expect(wrapper.find(TextChoiceInput)).toHaveLength(1);
        wrapper.unmount();
    });

    test('isUser', () => {
        const wrapper = mountWithAppServerContext(
            <EditInlineField
                {...DEFAULT_PROPS}
                column={
                    new QueryColumn({
                        fieldKey: 'test',
                        caption: 'Test',
                        readOnly: false,
                        userEditable: true,
                        shownInUpdateView: true,
                        lookup: {
                            schemaName: 'core',
                            queryName: 'users',
                        },
                    })
                }
            />,
            {},
            SERVER_CONTEXT
        );
        validate(wrapper, false, true, { user: 1 });
        wrapper.find('.edit-inline-field__toggle').simulate('click');
        validate(wrapper, true, true, { text: 1 });
        wrapper.unmount();
    });
});
