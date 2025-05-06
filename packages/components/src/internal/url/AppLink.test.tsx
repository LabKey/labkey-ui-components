import { parseAppPath } from './AppLink';

const CONTEXT_PATH = '';
let CONTROLLER = '';
let ACTION = '';
let CONTAINER = '';

jest.mock('@labkey/api', () => ({
    ActionURL: {
        getContextPath: () => CONTEXT_PATH,
        getAction: () => ACTION,
        getController: () => CONTROLLER,
        getContainer: () => CONTAINER,
    },
}));

// http://localhost:8080/SampleManager/Subfolder%20Two/samplemanager-appDev.view#/assays/General/Basic%20Assay%20Two/results

const TEST_PROJECT = '/My%20Project';
const TEST_CHILD = '/My%20Child';
const TEST_SIBLING = '/SiblingFolder';

/**
 * Initializes the mocked ActionURL to point to a project folder
 */
function initProject(controller = 'samplemanager'): void {
    CONTROLLER = controller;
    ACTION = 'app';
    CONTAINER = `${TEST_PROJECT}`;
}

/**
 * Initializes the mock ActionURL to point to a child folder
 */
function initChild(controller = 'samplemanager'): void {
    CONTROLLER = controller;
    ACTION = 'app';
    CONTAINER = `${TEST_PROJECT}${TEST_CHILD}`;
}

const projectUrl = (appPath: string): string => `${CONTEXT_PATH}${TEST_PROJECT}/samplemanager-app.view#${appPath}`;
const childUrl = (appPath: string, child = TEST_CHILD): string =>
    `${CONTEXT_PATH}${TEST_PROJECT}${child}/samplemanager-app.view#${appPath}`;

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
        const appPath = '/assays/General/Basic%20Assay%20Two/results';
        const to = parseAppPath(projectUrl(appPath));

        // An URL in the current folder should return the React Router Path
        expect(to).toEqual(appPath);
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
        const to = parseAppPath(`${CONTEXT_PATH}${TEST_PROJECT}/project-begin.view`);

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
        const to = parseAppPath(`${CONTEXT_PATH}/admin-showAdmin.view`);

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
