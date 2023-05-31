import React from 'react';

import { fromJS } from 'immutable';

import { mountWithServerContext } from '../../enzymeTestHelpers';
import { TEST_USER_APP_ADMIN } from '../../userFixtures';

import { Grid } from '../base/Grid';
import { UserLink } from '../user/UserLink';

import { AuditDetails } from './AuditDetails';

import { AuditDetailsModel } from './models';

describe('AuditDetails', () => {
    test('default props, empty', () => {
        const wrapper = mountWithServerContext(<AuditDetails rowId={undefined} user={TEST_USER_APP_ADMIN} />, {
            user: TEST_USER_APP_ADMIN,
        });
        expect(wrapper.find('.panel-heading').text()).toBe('Audit Event Details');
        expect(wrapper.find('.panel-body').text()).toBe('No audit event selected.');
        wrapper.unmount();
    });

    test('emptyMsg', () => {
        const wrapper = mountWithServerContext(
            <AuditDetails rowId={undefined} user={TEST_USER_APP_ADMIN} emptyMsg="test empty" />,
            {
                user: TEST_USER_APP_ADMIN,
            }
        );
        expect(wrapper.find('.panel-heading').text()).toBe('Audit Event Details');
        expect(wrapper.find('.panel-body').text()).toBe('test empty');
        wrapper.unmount();
    });

    test('summary and title', () => {
        const wrapper = mountWithServerContext(
            <AuditDetails rowId={1} user={TEST_USER_APP_ADMIN} summary="test summary" title="test title" />,
            { user: TEST_USER_APP_ADMIN }
        );
        expect(wrapper.find('.panel-heading').text()).toBe('test title');
        expect(wrapper.find('.panel-body').text()).toBe('test summary');
        expect(wrapper.find(Grid)).toHaveLength(0);
        wrapper.unmount();
    });

    test('gridData', () => {
        const wrapper = mountWithServerContext(
            <AuditDetails
                rowId={1}
                user={TEST_USER_APP_ADMIN}
                gridData={fromJS([{ field: 'a', value: { value: 'test' } }])}
            />,
            { user: TEST_USER_APP_ADMIN }
        );
        expect(wrapper.find(Grid)).toHaveLength(1);
        expect(wrapper.find(UserLink)).toHaveLength(0);
        expect(wrapper.find('.panel-body').text()).toBe('atest');
        wrapper.unmount();
    });

    test('gridData, isUser', () => {
        const wrapper = mountWithServerContext(
            <AuditDetails
                rowId={1}
                user={TEST_USER_APP_ADMIN}
                gridData={fromJS([{ field: 'a', value: 1, isUser: true }])}
            />,
            { user: TEST_USER_APP_ADMIN }
        );
        expect(wrapper.find(Grid)).toHaveLength(1);
        expect(wrapper.find(UserLink)).toHaveLength(1);
        expect(wrapper.find('.panel-body').text()).toBe('a<1>');
        wrapper.unmount();
    });

    test('gridData, urlType user', () => {
        const wrapper = mountWithServerContext(
            <AuditDetails
                rowId={1}
                user={TEST_USER_APP_ADMIN}
                gridData={fromJS([{ field: 'a', value: { value: 1, displayValue: 'test', urlType: 'user' } }])}
            />,
            { user: TEST_USER_APP_ADMIN }
        );
        expect(wrapper.find(Grid)).toHaveLength(1);
        expect(wrapper.find(UserLink)).toHaveLength(1);
        expect(wrapper.find('.panel-body').text()).toBe('atest');
        wrapper.unmount();
    });

    test('changeDetails', () => {
        const wrapper = mountWithServerContext(
            <AuditDetails
                rowId={1}
                user={TEST_USER_APP_ADMIN}
                changeDetails={AuditDetailsModel.create({
                    oldData: { a: 1 },
                    newData: { a: 2 },
                })}
            />,
            { user: TEST_USER_APP_ADMIN }
        );
        expect(wrapper.find(Grid)).toHaveLength(0);
        expect(wrapper.find(UserLink)).toHaveLength(0);
        expect(wrapper.find('.panel-body').text()).toBe('a12');
        wrapper.unmount();
    });
});
