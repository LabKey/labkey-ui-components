import { Project } from '@labkey/api';

import { Container, ContainerDateFormats } from './components/base/models/Container';

const TEST_DATE_FORMATS: ContainerDateFormats = {
    dateFormat: 'yyyy-MM-dd',
    dateTimeFormat: 'yyyy-MM-dd HH:mm',
    numberFormat: null,
};

export const TEST_PROJECT_CONTAINER = new Container({
    activeModules: ['a', 'b', 'c'],
    formats: TEST_DATE_FORMATS,
    id: 'a685712e-0900-103a-9486-0131958dce60',
    isContainerTab: false,
    isWorkbook: false,
    name: 'TestProjectContainer',
    parentId: '785eb92a-95aa-1039-9db0-ffabf47c5c38',
    parentPath: '/',
    path: '/TestProjectContainer',
    title: 'Test Project Container',
    type: 'project',
    effectivePermissions: ['org.labkey.api.security.permissions.AdminPermission'],
});

export const TEST_PROJECT: Project = {
    id: TEST_PROJECT_CONTAINER.id,
    name: TEST_PROJECT_CONTAINER.name,
    path: TEST_PROJECT_CONTAINER.path,
    rootId: TEST_PROJECT_CONTAINER.parentId,
    title: TEST_PROJECT_CONTAINER.title,
};

export const TEST_FOLDER_CONTAINER = new Container({
    activeModules: ['a', 'b', 'c'],
    formats: TEST_DATE_FORMATS,
    id: 'b685712f-0800-103a-9286-0131958dcf60',
    isContainerTab: false,
    isWorkbook: false,
    name: 'TestFolderContainer',
    parentId: TEST_PROJECT_CONTAINER.id,
    parentPath: TEST_PROJECT_CONTAINER.path,
    path: `${TEST_PROJECT_CONTAINER.path}/TestFolderContainer`,
    title: 'Test Folder Container',
    type: 'folder',
    effectivePermissions: ['org.labkey.api.security.permissions.AdminPermission'],
});

export const TEST_FOLDER_OTHER_CONTAINER = new Container({
    activeModules: ['a', 'b', 'c'],
    formats: TEST_DATE_FORMATS,
    id: 'b685712f-0800-103a-9286-0131958dcf69',
    isContainerTab: false,
    isWorkbook: false,
    name: 'OtherTestFolderContainer',
    parentId: TEST_PROJECT_CONTAINER.id,
    parentPath: TEST_PROJECT_CONTAINER.path,
    path: `${TEST_PROJECT_CONTAINER.path}/OtherTestFolderContainer`,
    title: 'Other Test Folder Container',
    type: 'folder',
    effectivePermissions: ['org.labkey.api.security.permissions.AdminPermission'],
});
