import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithAppContext } from '../test/reactTestLibraryHelpers';

import { QueryColumn } from '../../public/QueryColumn';

import { TEST_USER_EDITOR } from '../userFixtures';

import { EditInlineField } from './EditInlineField';

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

    const APP_CONTEXT = {
        container: {
            formats: {
                dateFormat: 'yyyy-MM-dd',
                dateTimeFormat: 'yyyy-MM-dd HH:mm',
                numberFormat: null,
            },
        },
    };

    function validate(editing = false, allowEdit = true, type?: Record<string, number>): void {
        expect(document.querySelectorAll('.edit-inline-field__label')).toHaveLength(!editing ? 1 : 0);
        expect(document.querySelectorAll('.edit-inline-field__toggle')).toHaveLength(!editing && allowEdit ? 1 : 0);
        expect(document.querySelectorAll('.fa-pencil')).toHaveLength(!editing && allowEdit ? 1 : 0);
        if (!editing) {
            expect(document.querySelector('.edit-inline-field__label').innerHTML).toBe('Test Label');
        }

        expect(document.querySelectorAll('.date-input')).toHaveLength(type?.date ?? 0);
        expect(document.querySelectorAll('textarea')).toHaveLength(type?.textarea ?? 0);
        expect(document.querySelectorAll('input')).toHaveLength(type?.text ?? type?.date ?? 0);

        expect(document.querySelectorAll('.user-link')).toHaveLength(type?.user ?? 0);
    }

    test('default props', () => {
        renderWithAppContext(<EditInlineField {...DEFAULT_PROPS} />, {
            serverContext: SERVER_CONTEXT,
            appContext: APP_CONTEXT,
        });
        validate();
        expect(document.querySelector('.edit-inline-field__placeholder').innerHTML).toBe('');
        expect(document.querySelectorAll('.fa-pencil')).toHaveLength(1);
        userEvent.click(document.querySelector('.edit-inline-field__toggle'));
        validate(true, true, { text: 1 });
    });

    test('not allowEdit', () => {
        renderWithAppContext(<EditInlineField {...DEFAULT_PROPS} allowEdit={false} />, {
            serverContext: SERVER_CONTEXT,
            appContext: APP_CONTEXT,
        });
        validate(false, false);
    });

    test('emptyText', () => {
        renderWithAppContext(<EditInlineField {...DEFAULT_PROPS} emptyText="Test Empty Text" />, {
            serverContext: SERVER_CONTEXT,
            appContext: APP_CONTEXT,
        });
        validate();
        expect(document.querySelector('.edit-inline-field__placeholder').innerHTML).toBe('Test Empty Text');
    });

    test('with value', () => {
        renderWithAppContext(<EditInlineField {...DEFAULT_PROPS} value="testing value" />, {
            serverContext: SERVER_CONTEXT,
            appContext: APP_CONTEXT,
        });
        validate();
        expect(document.querySelectorAll('.edit-inline-field__placeholder')).toHaveLength(0);
        expect(screen.getByText('testing value')).toBeInTheDocument();
    });

    test('with RowValue, displayValue', () => {
        renderWithAppContext(<EditInlineField {...DEFAULT_PROPS} value={{ value: 1, displayValue: 'Test1' }} />, {
            serverContext: SERVER_CONTEXT,
            appContext: APP_CONTEXT,
        });
        validate();
        expect(document.querySelectorAll('.edit-inline-field__placeholder')).toHaveLength(0);
        expect(screen.getByText('Test1')).toBeInTheDocument();
    });

    test('with RowValue, formattedValue', () => {
        renderWithAppContext(
            <EditInlineField
                {...DEFAULT_PROPS}
                value={{ value: 1, displayValue: 'Test1', formattedValue: 'Test1.0' }}
            />,
            { serverContext: SERVER_CONTEXT, appContext: APP_CONTEXT }
        );
        validate();
        expect(document.querySelectorAll('.edit-inline-field__placeholder')).toHaveLength(0);
        expect(screen.getByText('Test1.0')).toBeInTheDocument();
    });

    test('with RowValue, url', () => {
        renderWithAppContext(
            <EditInlineField
                {...DEFAULT_PROPS}
                value={{ value: 1, displayValue: 'Test1', url: 'https://www.labkey.org' }}
            />,
            { serverContext: SERVER_CONTEXT, appContext: APP_CONTEXT }
        );
        validate();
        expect(document.querySelectorAll('.edit-inline-field__placeholder')).toHaveLength(0);
        expect(screen.getByText('Test1')).toBeInTheDocument();
        expect(screen.getByText('Test1').closest('a')).toHaveAttribute('href', 'https://www.labkey.org');
    });

    test('isTextArea', () => {
        renderWithAppContext(<EditInlineField {...DEFAULT_PROPS} type="textarea" />, {
            serverContext: SERVER_CONTEXT,
            appContext: APP_CONTEXT,
        });
        validate();
        userEvent.click(document.querySelector('.edit-inline-field__toggle'));
        validate(true, true, { textarea: 1 });
    });

    test('isDate, no initial value', () => {
        renderWithAppContext(<EditInlineField {...DEFAULT_PROPS} type="date" />, {
            serverContext: SERVER_CONTEXT,
            appContext: APP_CONTEXT,
        });
        validate();
        userEvent.click(document.querySelector('.edit-inline-field__toggle'));
        validate(true, true, { date: 1 });
        expect(document.querySelectorAll('.react-datepicker')).toHaveLength(1);
        expect(document.querySelector('.react-datepicker__input-container input').value).toBe('');
    });

    test('isDate, with initial value', () => {
        renderWithAppContext(<EditInlineField {...DEFAULT_PROPS} type="date" value="2022-08-11 18:00:00" />, {
            serverContext: SERVER_CONTEXT,
            appContext: APP_CONTEXT,
        });
        validate();
        userEvent.click(document.querySelector('.edit-inline-field__toggle'));
        validate(true, true, { date: 1 });
        expect(document.querySelectorAll('.react-datepicker')).toHaveLength(1);
        expect(document.querySelector('.react-datepicker__input-container input').value).toBe('2022-08-11');
    });

    test('isDate, with initial value and QueryColumn format', () => {
        renderWithAppContext(
            <EditInlineField
                {...DEFAULT_PROPS}
                type="date"
                value="2022-08-11 18:00:00"
                column={new QueryColumn({ format: 'MM/dd/YYYY HH:mm:ss' })}
            />,
            { serverContext: SERVER_CONTEXT, appContext: APP_CONTEXT }
        );
        validate();
        userEvent.click(document.querySelector('.edit-inline-field__toggle'));
        validate(true, true, { date: 1 });
        expect(document.querySelectorAll('.react-datepicker')).toHaveLength(1);
        expect(document.querySelector('.react-datepicker__input-container input').value).toBe('08/11/2022 18:00:00');
    });

    test('resolveDetailEditRenderer', () => {
        renderWithAppContext(
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
            { serverContext: SERVER_CONTEXT, appContext: APP_CONTEXT }
        );
        validate();
        userEvent.click(document.querySelector('.edit-inline-field__toggle'));
        validate(true, true, { text: 2, select: 11 });
        expect(document.querySelectorAll('.select-input-container')).toHaveLength(1);
    });

    test('isUser', () => {
        renderWithAppContext(
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
                value={{ value: 1100, displayValue: 'Test User' }}
            />,
            { serverContext: SERVER_CONTEXT, appContext: APP_CONTEXT }
        );
        validate(false, true, { user: 1 });
        userEvent.click(document.querySelector('.edit-inline-field__toggle'));
        validate(true, true, { text: 1 });
    });
});
