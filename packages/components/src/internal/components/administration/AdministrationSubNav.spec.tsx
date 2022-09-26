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

describe('AdministrationSubNavImpl', () => {
    test('requires admin', () => {
        const wrapper = shallow(
            <AdministrationSubNavImpl inProjectContainer={false} projectsEnabled={false} user={TEST_USER_GUEST} />
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
                inProjectContainer={false}
                projectsEnabled={false}
                user={TEST_USER_PROJECT_ADMIN}
            />
        );
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Projects')).toBe(-1);
        wrapper.setProps({ inProjectContainer: false, projectsEnabled: true });
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Projects')).toBe(-1);
        wrapper.setProps({ inProjectContainer: true, projectsEnabled: true });
        expect(wrapper.prop('tabs').findIndex(t => t.text === 'Projects')).toBe(4);
    });
});
