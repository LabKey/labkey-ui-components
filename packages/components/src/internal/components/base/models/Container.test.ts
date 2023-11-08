import { Container } from './Container';

describe('Container', () => {
    const defaultContainer = new Container();

    const folderContainer = new Container({
        activeModules: ['API', 'Core', 'Internal', 'Wiki'],
        id: '451662db-78af-103a-a70d-a5b3b92a5220',
        name: 'TinyFolder',
        parentId: '451659d4-78af-103a-a70d-a5b3b92a5220',
        parentPath: '/BigProject',
        path: '/BigProject/TinyFolder',
        type: 'folder',
    });

    const projectContainer = new Container({
        activeModules: ['API', 'Core', 'Internal', 'Wiki'],
        name: 'BigProject',
        id: '451659d4-78af-103a-a70d-a5b3b92a5220',
        parentId: '785eb92a-95aa-1039-9db0-ffabf47c5c38',
        parentPath: '/',
        path: '/BigProject',
        type: 'project',
    });

    // The properties of this container definition are copied from LABKEY.container in the root folder.
    const rootContainer = new Container({
        activeModules: ['API', 'Internal'],
        id: '785eb92a-95aa-1039-9db0-ffabf47c5c38',
        name: '',
        parentId: null,
        parentPath: null,
        path: '/',
        type: 'folder',
    });

    // The properties of this container definition are copied from LABKEY.container in the Shared project.
    const sharedContainer = new Container({
        activeModules: ['API', 'Core', 'Internal', 'Wiki'],
        name: 'Shared',
        id: '785eb967-95aa-1039-9db0-ffabf47c5c38',
        parentId: '785eb92a-95aa-1039-9db0-ffabf47c5c38',
        parentPath: '/',
        path: '/Shared',
        type: 'project',
    });

    test('hasActiveModule', () => {
        expect(folderContainer.hasActiveModule(undefined)).toBeFalsy();
        expect(folderContainer.hasActiveModule(null)).toBeFalsy();
        expect(folderContainer.hasActiveModule('bogus')).toBeFalsy();
        expect(folderContainer.hasActiveModule('core')).toBeFalsy();
        expect(folderContainer.hasActiveModule('Core')).toBeTruthy();
    });

    test('isFolder', () => {
        expect(defaultContainer.isFolder).toBe(false);
        expect(projectContainer.isFolder).toBe(false);
        expect(rootContainer.isFolder).toBe(false);
        expect(folderContainer.isFolder).toBe(true);
        expect(sharedContainer.isFolder).toBe(false);
    });

    test('isProject', () => {
        expect(defaultContainer.isProject).toBe(false);
        expect(projectContainer.isProject).toBe(true);
        expect(rootContainer.isProject).toBe(false);
        expect(folderContainer.isProject).toBe(false);
        expect(sharedContainer.isProject).toBe(true);
    });

    test('isRoot', () => {
        expect(defaultContainer.isRoot).toBe(false);
        expect(projectContainer.isRoot).toBe(false);
        expect(rootContainer.isRoot).toBe(true);
        expect(folderContainer.isRoot).toBe(false);
        expect(sharedContainer.isRoot).toBe(false);
    });

    test('isSharedProject', () => {
        expect(defaultContainer.isSharedProject).toBe(false);
        expect(projectContainer.isSharedProject).toBe(false);
        expect(rootContainer.isSharedProject).toBe(false);
        expect(folderContainer.isSharedProject).toBe(false);
        expect(sharedContainer.isSharedProject).toBe(true);
    });
});
