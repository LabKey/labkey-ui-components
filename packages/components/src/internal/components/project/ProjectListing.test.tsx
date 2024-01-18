import React from 'react';
import { render } from '@testing-library/react';

import { TEST_FOLDER_CONTAINER, TEST_FOLDER_OTHER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { ProjectListing } from './ProjectListing';

describe('ProjectListing', () => {
    const allProjects = [TEST_PROJECT_CONTAINER, TEST_FOLDER_CONTAINER, TEST_FOLDER_OTHER_CONTAINER];
    const DEFAULT_PROPS = {
        getIsDirty: jest.fn(),
        setIsDirty: jest.fn(),
        setSelectedProject: jest.fn(),
    };

    function verify(projectCount: number, inheritedCount: number) {
        const projects = document.querySelectorAll('.menu-section-item');
        expect(projects).toHaveLength(projectCount);

        const inherited = document.querySelectorAll('.menu-section-item .label-help-target');
        expect(inherited).toHaveLength(inheritedCount);

        const divider = document.querySelector('hr');
        if (inheritedCount > 0 && inheritedCount < projectCount - 1) expect(divider).toBeInTheDocument();
        else expect(divider).toBeNull();
    }

    test('no inherited', () => {
        render(<ProjectListing {...DEFAULT_PROPS} projects={allProjects} selectedProject={allProjects[0]} />);

        verify(3, 0);

        expect(document.querySelectorAll('.menu-section-item')[0].textContent).toBe('Test Project Container');
        expect(document.querySelectorAll('.menu-section-item')[1].textContent).toBe('Test Folder Container');
        expect(document.querySelectorAll('.menu-section-item')[2].textContent).toBe('Other Test Folder Container');
    });

    test('has inherited', () => {
        render(
            <ProjectListing
                {...DEFAULT_PROPS}
                projects={allProjects}
                inheritedProjects={[TEST_FOLDER_CONTAINER.name]}
                selectedProject={allProjects[0]}
            />
        );

        verify(3, 1);

        expect(document.querySelectorAll('.menu-section-item')[0].textContent).toBe('Test Project Container');
        expect(document.querySelectorAll('.menu-section-item')[1].textContent).toBe('Test Folder Container');
        expect(document.querySelectorAll('.menu-section-item')[2].textContent).toBe('Other Test Folder Container');
    });

    test('all inherited', () => {
        render(
            <ProjectListing
                {...DEFAULT_PROPS}
                projects={allProjects}
                inheritedProjects={[TEST_FOLDER_CONTAINER.name, TEST_FOLDER_OTHER_CONTAINER.name]}
                selectedProject={allProjects[0]}
            />
        );

        verify(3, 2);

        expect(document.querySelectorAll('.menu-section-item')[0].textContent).toBe('Test Project Container');
        expect(document.querySelectorAll('.menu-section-item')[1].textContent).toBe('Test Folder Container');
        expect(document.querySelectorAll('.menu-section-item')[2].textContent).toBe('Other Test Folder Container');
    });

    test('app at home project', () => {
        const homeContainer = { ...TEST_PROJECT_CONTAINER, path: '/home' };
        render(
            <ProjectListing
                {...DEFAULT_PROPS}
                projects={[homeContainer, TEST_FOLDER_CONTAINER, TEST_FOLDER_OTHER_CONTAINER]}
                selectedProject={homeContainer}
            />
        );

        verify(3, 0);

        expect(document.querySelectorAll('.menu-section-item')[0].textContent).toBe('Home Project');
        expect(document.querySelectorAll('.menu-section-item')[1].textContent).toBe('Test Folder Container');
        expect(document.querySelectorAll('.menu-section-item')[2].textContent).toBe('Other Test Folder Container');
    });
});
