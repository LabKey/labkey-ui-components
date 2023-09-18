import React from 'react';
import { shallow } from 'enzyme';

import {
    TEST_USER_APP_ADMIN,
    TEST_USER_EDITOR,
    TEST_USER_FOLDER_ADMIN,
    TEST_USER_GUEST,
    TEST_USER_PROJECT_ADMIN,
} from '../../userFixtures';

import { AdministrationSubNavImpl } from './AdministrationSubNav';
import {createMockWithRouterProps} from "../../mockUtils";

describe('AdministrationSubNavImpl', () => {

    test('requires admin', () => {
        const wrapper = shallow(
            <AdministrationSubNavImpl {...createMockWithRouterProps(jest.fn, {})} inProjectContainer={false} projectsEnabled={false} user={TEST_USER_GUEST} />
        );
        expect(wrapper.prop('tabs').size).toBe(0);
        wrapper.setProps({ user: TEST_USER_EDITOR });
        expect(wrapper.prop('tabs').size).toBe(0);
        wrapper.setProps({ user: TEST_USER_FOLDER_ADMIN });
        expect(wrapper.prop('tabs').size).toBe(5);
        wrapper.setProps({ user: TEST_USER_APP_ADMIN });
        expect(wrapper.prop('tabs').size).toBe(5);
    });
    test('displays "projects"', () => {
        const wrapper = shallow(
            <AdministrationSubNavImpl
                {...createMockWithRouterProps(jest.fn, {})}
                inProjectContainer={false}
                projectsEnabled={false}
                user={TEST_USER_PROJECT_ADMIN}
            />
        );
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Projects')).toBe(-1);

        wrapper.setProps({ inProjectContainer: false, projectsEnabled: true, isAppHome: false });
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Application Settings')).toBe(-1);
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Project Settings')).toBe(0);
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Projects')).toBe(1);
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Audit Logs')).toBe(2);
        // TODO, Users and Groups will be available in project container as part of "User Administration Improvements"
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Permissions')).toBe(3);

        wrapper.setProps({ inProjectContainer: true, projectsEnabled: true, isAppHome: true });
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Application Settings')).toBe(0);
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Project Settings')).toBe(-1);
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Projects')).toBe(1);
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Audit Logs')).toBe(2);
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Users')).toBe(3);
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Groups')).toBe(4);
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Permissions')).toBe(5);

    });
    test('display of Users or Groups', () => {
        const wrapper = shallow(
            <AdministrationSubNavImpl
                {...createMockWithRouterProps(jest.fn, {})}
                inProjectContainer={false}
                projectsEnabled={false}
                user={TEST_USER_PROJECT_ADMIN}
            />
        );
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Projects')).toBe(-1);
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Users')).toBe(2);
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Groups')).toBe(3);

        wrapper.setProps({ inProjectContainer: false, projectsEnabled: true });
        // TODO, Users and Groups will be available in project container as part of "User Administration Improvements"
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Users')).toBe(-1);
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Groups')).toBe(-1);
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Projects')).toBe(1);

        wrapper.setProps({ inProjectContainer: true, projectsEnabled: true });
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Projects')).toBe(1);
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Users')).toBe(3);
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Groups')).toBe(4);

    });
});
