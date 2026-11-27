/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createHashRouter, RouterProvider } from 'react-router';
// @ts-expect-error These helpers exist only in the Jest mock, not the package's types
import { __setAction, __setContainerPath, __setController } from '@labkey/api';

import { AppLink, parseAppPath } from './AppLink';

jest.unmock('react-router');

// In the test environment AppLink skips the in-app anchor these tests cover
jest.mock('../util/utils', () => ({
    ...jest.requireActual('../util/utils'),
    isTestEnv: () => false,
}));

const TEST_PROJECT = '/My Project';
const TEST_CHILD = '/My Child';
const TEST_SIBLING = '/SiblingFolder';

/**
 * Initializes the mocked ActionURL to point to a project folder
 */
function initProject(controller = 'samplemanager'): void {
    __setController(controller);
    __setAction('app');
    __setContainerPath(`${TEST_PROJECT}`);
}

/**
 * Initializes the mock ActionURL to point to a child folder
 */
function initChild(controller = 'samplemanager'): void {
    __setController(controller);
    __setAction('app');
    __setContainerPath(`${TEST_PROJECT}${TEST_CHILD}`);
}

const projectUrl = (appPath: string): string => encodeURI(`/labkey${TEST_PROJECT}/samplemanager-app.view#${appPath}`);
const childUrl = (appPath: string, child = TEST_CHILD): string =>
    encodeURI(`/labkey${TEST_PROJECT}${child}/samplemanager-app.view#${appPath}`);

describe('parseAppPath', () => {
    test('in project, app href in child folder', () => {
        initProject();
        const appPath = '/rd/run/533';
        const to = parseAppPath(childUrl(appPath));

        // An URL in child folder should return undefined
        expect(to).toEqual(undefined);
    });

    test('in project, app href in project', () => {
        initProject();
        const appPath = '/assays/General/Basic Assay Two/results';
        const to = parseAppPath(projectUrl(appPath));

        // An URL in the current folder should return the React Router Path
        expect(to).toEqual(encodeURI(appPath));
    });

    test('in project, app href in project, but different app', () => {
        initProject('freezermanager');
        const appPath = '/assays/General/Basic%20Assay%20Two/results';
        const to = parseAppPath(projectUrl(appPath));

        // A URL in the current folder, but for a different app, should return undefined
        expect(to).toEqual(undefined);
    });

    test('in project, non-app href in LKS', () => {
        initProject();
        const to = parseAppPath(`/labkey${TEST_PROJECT}/project-begin.view`);

        // A URL pointing to LKS should return undefined
        expect(to).toEqual(undefined);
    });

    test('in project, href is external URL', () => {
        initProject();
        const to = parseAppPath('https://www.example.com/');

        // An external URL should return undefined
        expect(to).toEqual(undefined);
    });

    test('in child folder, href in project', () => {
        initChild();
        const appPath = '/rd/run/533';
        const to = parseAppPath(projectUrl(appPath));

        // A URL in project folder should return undefined when we're in a child folder
        expect(to).toEqual(undefined);
    });

    test('in child folder, href in child folder', () => {
        initChild();
        const appPath = '/rd/run/533';
        const to = parseAppPath(childUrl(appPath));

        // A URL in child folder should return a path when we're in the child folder
        expect(to).toEqual(appPath);
    });

    test('in child folder, href in child folder, but different app', () => {
        initChild('magicapp');
        const appPath = '/some/path/to/a/magical/page';
        const to = parseAppPath(childUrl(appPath));

        // A URL in child folder, but for a different app, should return undefined
        expect(to).toEqual(undefined);
    });

    test('in child folder, href in sibling folder', () => {
        initChild();
        const appPath = '/rd/run/533';
        const to = parseAppPath(childUrl(appPath, TEST_SIBLING));

        // A URL in a sibling folder should return undefined
        expect(to).toEqual(undefined);
    });

    test('in child folder, href in LKS', () => {
        initChild();
        const to = parseAppPath('/labkey/admin-showAdmin.view');

        // A URL pointing to LKS should return undefined
        expect(to).toEqual(undefined);
    });

    test('in child folder, href is external URL', () => {
        initChild();
        const to = parseAppPath('https://test.example.com/some/url/path');

        // An external URL should return undefined
        expect(to).toEqual(undefined);
    });

    test('A path with a hash should return the same path without the hash', () => {
        initChild();
        expect(parseAppPath('#/rd/sample/1')).toEqual('/rd/sample/1');

        initProject();
        expect(parseAppPath('#/samples/new?creationType=Independent&target=MyTestSamples&quantity=1')).toEqual(
            '/samples/new?creationType=Independent&target=MyTestSamples&quantity=1'
        );
    });
});

const EXTERNAL_URL = 'https://www.example.com/';
const LINK_TEXT = 'Run 533';

describe('AppLink', () => {
    test('targetBlank', () => {
        render(
            <AppLink targetBlank to={EXTERNAL_URL}>
                {LINK_TEXT}
            </AppLink>
        );

        // Assert - targetBlank opens a new tab and defaults rel to protect it from the opener
        const link = screen.getByRole('link', { name: LINK_TEXT });
        expect(link).toHaveAttribute('href', EXTERNAL_URL);
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('rel and target props', () => {
        render(
            <AppLink rel="nofollow" target="_parent" to={EXTERNAL_URL}>
                {LINK_TEXT}
            </AppLink>
        );

        // Assert - without targetBlank the rel/target props are used as-is
        const link = screen.getByRole('link', { name: LINK_TEXT });
        expect(link).toHaveAttribute('target', '_parent');
        expect(link).toHaveAttribute('rel', 'nofollow');
    });

    test('targetBlank does not supersede rel and target props', () => {
        render(
            <AppLink rel="nofollow" target="_parent" targetBlank to={EXTERNAL_URL}>
                {LINK_TEXT}
            </AppLink>
        );

        // Assert - both props supersede the targetBlank defaults
        const link = screen.getByRole('link', { name: LINK_TEXT });
        expect(link).toHaveAttribute('target', '_parent');
        expect(link).toHaveAttribute('rel', 'nofollow');
    });

    test('targetBlank with only a target prop', () => {
        render(
            <AppLink target="_parent" targetBlank to={EXTERNAL_URL}>
                {LINK_TEXT}
            </AppLink>
        );

        // Assert - the target prop supersedes its targetBlank default, but the rel default still applies
        const link = screen.getByRole('link', { name: LINK_TEXT });
        expect(link).toHaveAttribute('target', '_parent');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('no targetBlank, rel, or target', () => {
        render(<AppLink to={EXTERNAL_URL}>{LINK_TEXT}</AppLink>);

        // Assert - neither attribute is rendered when nothing asks for them
        const link = screen.getByRole('link', { name: LINK_TEXT });
        expect(link).not.toHaveAttribute('target');
        expect(link).not.toHaveAttribute('rel');
    });
});

describe('AppLink in a data router', () => {
    const APP_PATH = '/rd/run/533';
    const OTHER_PATH = '/samples';

    let routers: ReturnType<typeof createHashRouter>[] = [];
    const trackRouter = <R extends ReturnType<typeof createHashRouter>>(router: R): R => {
        routers.push(router);
        return router;
    };

    afterEach(() => {
        // Unmount before disposing, so no RouterProvider is left subscribed to a disposed router
        cleanup();
        routers.forEach(router => router.dispose());
        routers = [];
        window.history.replaceState(null, '', window.location.pathname);
    });

    const renderInRouter = (link: ReactNode, initialPath = OTHER_PATH) => {
        window.history.replaceState(null, '', `#${initialPath}`);
        const router = trackRouter(
            createHashRouter([
                { element: link, path: OTHER_PATH },
                { element: link, path: APP_PATH },
            ])
        );
        // jsdom lacks the Request a real navigation builds, so only the call is checked
        const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(undefined);
        render(<RouterProvider router={router} />);
        return navigate;
    };

    // Returns whether the click was left to the browser, then cancels it since jsdom cannot navigate
    const clickLink = (init?: MouseEventInit): boolean => {
        let leftToBrowser: boolean;
        const onWindowClick = (event: MouseEvent): void => {
            leftToBrowser = !event.defaultPrevented;
            event.preventDefault();
        };
        window.addEventListener('click', onWindowClick);
        try {
            fireEvent.click(screen.getByRole('link', { name: LINK_TEXT }), init);
        } finally {
            window.removeEventListener('click', onWindowClick);
        }
        return leftToBrowser;
    };

    test('href is the app path behind a hash', () => {
        renderInRouter(<AppLink to={`#${APP_PATH}`}>{LINK_TEXT}</AppLink>);
        expect(screen.getByRole('link', { name: LINK_TEXT })).toHaveAttribute('href', `#${APP_PATH}`);
    });

    test('relative path resolves against the current route', () => {
        renderInRouter(<AppLink to="#run/533">{LINK_TEXT}</AppLink>);
        expect(screen.getByRole('link', { name: LINK_TEXT })).toHaveAttribute('href', `#${OTHER_PATH}/run/533`);
    });

    test('click navigates through the router', () => {
        const onClick = jest.fn();
        const navigate = renderInRouter(
            <AppLink onClick={onClick} to={`#${APP_PATH}`}>
                {LINK_TEXT}
            </AppLink>
        );

        expect(clickLink()).toBe(false);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(navigate).toHaveBeenCalledWith(APP_PATH, expect.objectContaining({ replace: false }));
    });

    test('click on the current location replaces its history entry', () => {
        const navigate = renderInRouter(<AppLink to={`#${APP_PATH}`}>{LINK_TEXT}</AppLink>, APP_PATH);

        expect(clickLink()).toBe(false);
        expect(navigate).toHaveBeenCalledWith(APP_PATH, expect.objectContaining({ replace: true }));
    });

    test.each<[string, MouseEventInit]>([
        ['meta', { metaKey: true }],
        ['ctrl', { ctrlKey: true }],
        ['shift', { shiftKey: true }],
        ['alt', { altKey: true }],
        ['middle button', { button: 1 }],
    ])('%s click is left to the browser', (_, init) => {
        const navigate = renderInRouter(<AppLink to={`#${APP_PATH}`}>{LINK_TEXT}</AppLink>);

        expect(clickLink(init)).toBe(true);
        expect(navigate).not.toHaveBeenCalled();
    });

    test('click on a link with a new target is left to the browser', () => {
        const navigate = renderInRouter(
            <AppLink targetBlank to={`#${APP_PATH}`}>
                {LINK_TEXT}
            </AppLink>
        );

        expect(clickLink()).toBe(true);
        expect(navigate).not.toHaveBeenCalled();
    });

    test('caller can cancel the navigation', () => {
        const onClick = jest.fn((event: ReactMouseEvent) => event.preventDefault());
        const navigate = renderInRouter(
            <AppLink onClick={onClick} to={`#${APP_PATH}`}>
                {LINK_TEXT}
            </AppLink>
        );

        expect(clickLink()).toBe(false);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(navigate).not.toHaveBeenCalled();
    });
});
