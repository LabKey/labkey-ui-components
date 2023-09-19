import React from 'react';
import { render } from '@testing-library/react';
import {TEST_FOLDER_CONTAINER, TEST_FOLDER_OTHER_CONTAINER, TEST_PROJECT_CONTAINER} from "../../containerFixtures";
import {ProjectListing} from "./ProjectListing";

describe('ProjectListing', () => {
    const allProjects = [TEST_PROJECT_CONTAINER, TEST_FOLDER_CONTAINER, TEST_FOLDER_OTHER_CONTAINER];
    const DEFAULT_PROPS = {
        getIsDirty: jest.fn(),
        setIsDirty: jest.fn(),
        setSelectedProject: jest.fn(),
    }

    function verify(projectCount: number, inheritedCount: number)
    {
        const projects = document.querySelectorAll('.menu-section-item');
        expect(projects).toHaveLength(projectCount);

        const inherited = document.querySelectorAll('.menu-section-item .label-help-target');
        expect(inherited).toHaveLength(inheritedCount);


        const divider = document.querySelector('hr');
        if (inheritedCount > 0 && inheritedCount < projectCount -1)
            expect(divider).toBeInTheDocument();
        else
            expect(divider).toBeNull();
    }

    test('no inherited', () => {
        render(
            <ProjectListing
                {...DEFAULT_PROPS}
                projects={allProjects}
                selectedProject={allProjects[0]}
            />
        );

        verify(3, 0);
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
    });

});
