import React from 'react';

import { fromJS } from 'immutable';

import { TEST_USER_APP_ADMIN } from '../../userFixtures';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { AuditDetails } from './AuditDetails';

import { AuditDetailsModel } from './models';

describe('AuditDetails', () => {
    test('default props, empty', () => {
        renderWithAppContext(<AuditDetails rowId={undefined} user={TEST_USER_APP_ADMIN} />, {
            serverContext: {
                user: TEST_USER_APP_ADMIN,
            },
        });
        expect(document.querySelector('.panel-heading').textContent).toBe('Audit Event Details');
        expect(document.querySelector('.panel-body').textContent).toBe('No audit event selected.');
    });

    test('emptyMsg', () => {
        renderWithAppContext(<AuditDetails rowId={undefined} user={TEST_USER_APP_ADMIN} emptyMsg="test empty" />, {
            serverContext: {
                user: TEST_USER_APP_ADMIN,
            },
        });
        expect(document.querySelector('.panel-heading').textContent).toBe('Audit Event Details');
        expect(document.querySelector('.panel-body').textContent).toBe('test empty');
    });

    test('summary and title', () => {
        renderWithAppContext(
            <AuditDetails rowId={1} user={TEST_USER_APP_ADMIN} summary="test summary" title="test title" />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );
        expect(document.querySelector('.panel-heading').textContent).toBe('test title');
        expect(document.querySelector('.panel-body').textContent).toBe('test summary');
        expect(document.querySelectorAll('.table-responsive')).toHaveLength(0);
    });

    test('gridData', () => {
        renderWithAppContext(
            <AuditDetails
                rowId={1}
                user={TEST_USER_APP_ADMIN}
                gridData={fromJS([{ field: 'a', value: { value: 'test' } }])}
            />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );
        expect(document.querySelectorAll('.table-responsive')).toHaveLength(1);
        expect(document.querySelectorAll('.user-link')).toHaveLength(0);
        expect(document.querySelector('.panel-body').textContent).toBe('atest');
    });

    test('gridData, isUser', () => {
        renderWithAppContext(
            <AuditDetails
                rowId={1}
                user={TEST_USER_APP_ADMIN}
                gridData={fromJS([{ field: 'a', value: 1, isUser: true }])}
            />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );
        expect(document.querySelectorAll('.table-responsive')).toHaveLength(1);
        expect(document.querySelectorAll('span.gray-text')).toHaveLength(1); // disabled user-link
        expect(document.querySelectorAll('span.gray-text')[0].getAttribute('title')).toBe(
            'User may have been deleted from the system or no longer have permissions within this folder.'
        );
        expect(document.querySelector('.panel-body').textContent).toBe('a<1>');
    });

    test('gridData, urlType user', () => {
        renderWithAppContext(
            <AuditDetails
                rowId={1}
                user={TEST_USER_APP_ADMIN}
                gridData={fromJS([{ field: 'a', value: { value: 1, displayValue: 'test', urlType: 'user' } }])}
            />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );
        expect(document.querySelectorAll('.table-responsive')).toHaveLength(1);
        expect(document.querySelectorAll('.user-link')).toHaveLength(1);
        expect(document.querySelector('.panel-body').textContent).toBe('atest');
    });

    test('changeDetails', () => {
        renderWithAppContext(
            <AuditDetails
                rowId={1}
                user={TEST_USER_APP_ADMIN}
                changeDetails={AuditDetailsModel.create({
                    oldData: { a: 1 },
                    newData: { a: 2 },
                })}
            />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );
        expect(document.querySelectorAll('.table-responsive')).toHaveLength(0);
        expect(document.querySelectorAll('.user-link')).toHaveLength(0);
        expect(document.querySelector('.panel-body').textContent).toBe('a12');
    });
});
