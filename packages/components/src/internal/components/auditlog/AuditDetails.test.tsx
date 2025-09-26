import React from 'react';

import { fromJS } from 'immutable';

import { TEST_USER_APP_ADMIN } from '../../userFixtures';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { AuditDetails } from './AuditDetails';

import { AuditDetailsModel } from './models';
import { AUDIT_DETAIL_FIELD_VALUE_INHERITED } from './constants';

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
        renderWithAppContext(<AuditDetails emptyMsg="test empty" rowId={undefined} user={TEST_USER_APP_ADMIN} />, {
            serverContext: {
                user: TEST_USER_APP_ADMIN,
            },
        });
        expect(document.querySelector('.panel-heading').textContent).toBe('Audit Event Details');
        expect(document.querySelector('.panel-body').textContent).toBe('test empty');
    });

    test('summary and title', () => {
        renderWithAppContext(
            <AuditDetails rowId={1} summary="test summary" title="test title" user={TEST_USER_APP_ADMIN} />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );
        expect(document.querySelector('.panel-heading').textContent).toBe('test title');
        expect(document.querySelector('.panel-body').textContent).toBe('test summary');
        expect(document.querySelectorAll('.table-responsive')).toHaveLength(0);
    });

    test('gridData', () => {
        renderWithAppContext(
            <AuditDetails
                gridData={fromJS([{ field: 'a', value: { value: 'test' } }])}
                rowId={1}
                user={TEST_USER_APP_ADMIN}
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
                gridData={fromJS([{ field: 'a', value: 1, isUser: true }])}
                rowId={1}
                user={TEST_USER_APP_ADMIN}
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
                gridData={fromJS([{ field: 'a', value: { value: 1, displayValue: 'test', urlType: 'user' } }])}
                rowId={1}
                user={TEST_USER_APP_ADMIN}
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
                changeDetails={AuditDetailsModel.create({
                    oldData: { a: 1 },
                    newData: { a: 2 },
                })}
                rowId={1}
                user={TEST_USER_APP_ADMIN}
            />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );
        expect(document.querySelectorAll('.table-responsive')).toHaveLength(0);
        expect(document.querySelectorAll('.user-link')).toHaveLength(0);
        expect(document.querySelector('.panel-body').textContent).toBe('a12');
    });
    test('provided data', () => {
        renderWithAppContext(
            <AuditDetails
                changeDetails={AuditDetailsModel.create({
                    oldData: { a: 'file.txt' },
                    newData: { a: 'new-1.txt' },
                    providedValues: {
                        a: 'new.txt',
                    },
                })}
                rowId={1}
                user={TEST_USER_APP_ADMIN}
            />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );
        expect(document.querySelectorAll('.table-responsive')).toHaveLength(0);
        expect(document.querySelectorAll('.user-link')).toHaveLength(0);
        expect(document.querySelector('.panel-body').textContent).toBe('afile.txtnew-1.txt');
        expect(document.querySelector('.original-value-icon')).toBeInTheDocument();
    });
    test('provided data delta', () => {
        renderWithAppContext(
            <AuditDetails
                changeDetails={AuditDetailsModel.create({
                    oldData: { a: 'file.txt' },
                    newData: { a: 'new-1.txt' },
                    providedDeltaValues: {
                        a: '3L',
                    },
                })}
                rowId={1}
                user={TEST_USER_APP_ADMIN}
            />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );
        expect(document.querySelectorAll('.table-responsive')).toHaveLength(0);
        expect(document.querySelectorAll('.user-link')).toHaveLength(0);
        expect(document.querySelector('.panel-body').textContent).toBe('afile.txtnew-1.txt');
        expect(document.querySelector('.original-value-icon')).toBeInTheDocument();
    });

    test('with inheritedFieldMsg, without inherited value', () => {
        renderWithAppContext(
            <AuditDetails
                changeDetails={AuditDetailsModel.create({
                    oldData: { a: 1 },
                    newData: { a: 2 },
                })}
                inheritedFieldMsg="This value is inherited from a parent folder."
                rowId={1}
                user={TEST_USER_APP_ADMIN}
            />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );
        expect(document.querySelector('.panel-body').textContent).toBe('a12');
        expect(document.querySelectorAll('.fa-info-circle')).toHaveLength(0);
    });

    test('with inherited value', () => {
        renderWithAppContext(
            <AuditDetails
                changeDetails={AuditDetailsModel.create({
                    newData: { a: AUDIT_DETAIL_FIELD_VALUE_INHERITED },
                    oldData: {},
                })}
                inheritedFieldMsg="This value is inherited from a parent folder."
                rowId={1}
                user={TEST_USER_APP_ADMIN}
            />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );
        expect(document.querySelector('.panel-body').textContent).toBe('aInherited');
        expect(document.querySelectorAll('.fa-info-circle')).toHaveLength(1);
    });

    test('with inherited value, no inheritedFieldMsg', () => {
        renderWithAppContext(
            <AuditDetails
                changeDetails={AuditDetailsModel.create({
                    newData: { a: AUDIT_DETAIL_FIELD_VALUE_INHERITED },
                    oldData: {},
                })}
                rowId={1}
                user={TEST_USER_APP_ADMIN}
            />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );
        expect(document.querySelector('.panel-body').textContent).toBe('aInherited');
        expect(document.querySelectorAll('.fa-info-circle')).toHaveLength(0);
    });

    test('with inherited value, with oldData', () => {
        renderWithAppContext(
            <AuditDetails
                changeDetails={AuditDetailsModel.create({
                    oldData: { a: 1 },
                    newData: { a: AUDIT_DETAIL_FIELD_VALUE_INHERITED },
                })}
                inheritedFieldMsg="This value is inherited from a parent folder."
                rowId={1}
                user={TEST_USER_APP_ADMIN}
            />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );
        expect(document.querySelector('.panel-body').textContent).toBe('a1Inherited');
        expect(document.querySelectorAll('.fa-info-circle')).toHaveLength(1);
    });

    test('with inherited value, with oldData inherited', () => {
        renderWithAppContext(
            <AuditDetails
                changeDetails={AuditDetailsModel.create({
                    oldData: { a: AUDIT_DETAIL_FIELD_VALUE_INHERITED },
                    newData: { a: 1 },
                })}
                inheritedFieldMsg="This value is inherited from a parent folder."
                rowId={1}
                user={TEST_USER_APP_ADMIN}
            />,
            { serverContext: { user: TEST_USER_APP_ADMIN } }
        );
        expect(document.querySelector('.panel-body').textContent).toBe('aInherited1');
        expect(document.querySelectorAll('.fa-info-circle')).toHaveLength(0);
    });
});
