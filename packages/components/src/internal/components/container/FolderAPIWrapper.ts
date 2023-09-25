import { rejects } from 'assert';

import { ActionURL, Ajax, Utils } from '@labkey/api';

import { Container } from '../base/models/Container';
import { handleRequestFailure } from '../../util/utils';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';
import { DataTypeEntity, ProjectConfigurableDataType } from '../entities/models';
import { isAppHomeFolder } from '../../app/utils';
import { fetchContainers } from '../permissions/actions';
import { ModuleContext } from '../base/ServerContext';
import { naturalSortByProperty } from '../../../public/sort';

export interface ProjectSettingsOptions {
    allowUserSpecifiedNames?: boolean;
    disabledAssayDesigns?: number[];
    disabledDataClasses?: number[];
    disabledSampleTypes?: number[];
    disabledStorageLocations?: number[];
    name?: string;
    nameAsTitle?: boolean;
    prefix?: string;
    title?: string;
}

export interface UpdateProjectSettingsOptions {
    defaultDateTimeFormat?: string;
}

export interface FolderAPIWrapper {
    createProject: (options: ProjectSettingsOptions, containerPath?: string) => Promise<Container>;
    getDataTypeExcludedProjects: (dataType: ProjectConfigurableDataType, dataTypeRowId: number) => Promise<string[]>;
    getProjects: (
        container?: Container,
        moduleContext?: ModuleContext,
        includeStandardProperties?: boolean,
        includeEffectivePermissions?: boolean,
        includeTopFolder?: boolean
    ) => Promise<Container[]>;
    renameProject: (options: ProjectSettingsOptions, containerPath?: string) => Promise<Container>;
    updateProjectDataExclusions: (options: ProjectSettingsOptions, containerPath?: string) => Promise<void>;
    updateProjectLookAndFeelSettings: (options: UpdateProjectSettingsOptions, containerPath?: string) => Promise<void>;
}

export class ServerFolderAPIWrapper implements FolderAPIWrapper {
    createProject = (options: ProjectSettingsOptions, containerPath?: string): Promise<Container> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL(
                    SAMPLE_MANAGER_APP_PROPERTIES.controllerName,
                    'createProject.api',
                    containerPath
                ),
                method: 'POST',
                jsonData: options,
                success: Utils.getCallbackWrapper(({ project }) => {
                    resolve(new Container(project));
                }),
                failure: handleRequestFailure(reject, 'Failed to create project'),
            });
        });
    };

    renameProject = (options: ProjectSettingsOptions, containerPath?: string): Promise<Container> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL(
                    SAMPLE_MANAGER_APP_PROPERTIES.controllerName,
                    'renameProject.api',
                    containerPath
                ),
                method: 'POST',
                jsonData: options,
                success: Utils.getCallbackWrapper(({ data }) => {
                    resolve(new Container(data.project));
                }),
                failure: handleRequestFailure(reject, 'Failed to rename project'),
            });
        });
    };

    updateProjectDataExclusions = (options: ProjectSettingsOptions, containerPath?: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL(
                    SAMPLE_MANAGER_APP_PROPERTIES.controllerName,
                    'updateProjectDataExclusion.api',
                    containerPath
                ),
                method: 'POST',
                jsonData: options,
                success: Utils.getCallbackWrapper(({ data }) => {
                    resolve();
                }),
                failure: handleRequestFailure(reject, 'Failed to update project data type'),
            });
        });
    };

    updateProjectLookAndFeelSettings = (
        options: UpdateProjectSettingsOptions,
        containerPath?: string
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL('admin', 'updateProjectSettings.api', containerPath),
                method: 'POST',
                jsonData: options,
                success: Utils.getCallbackWrapper(({ data }) => {
                    resolve();
                }),
                failure: handleRequestFailure(reject, 'Failed to update project look and feel settings'),
            });
        });
    };

    getDataTypeExcludedProjects = (dataType: ProjectConfigurableDataType, dataTypeRowId: number): Promise<string[]> => {
        if (!dataType || !dataTypeRowId) {
            return Promise.resolve(undefined);
        }
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'getDataTypeExclusion.api'),
                method: 'GET',
                params: {
                    dataType,
                    dataTypeRowId,
                },
                success: Utils.getCallbackWrapper(response => {
                    resolve(response['excludedProjects']);
                }),
                failure: handleRequestFailure(reject, 'Failed to get excluded projects'),
            });
        });
    };

    getProjects = (
        container?: Container,
        moduleContext?: ModuleContext,
        includeStandardProperties?: boolean,
        includeEffectivePermissions?: boolean,
        includeTopFolder?: boolean
    ): Promise<Container[]> => {
        return new Promise((resolve, reject) => {
            const topFolderPath = isAppHomeFolder(container, moduleContext) ? container.path : container.parentPath;
            fetchContainers({
                containerPath: topFolderPath,
                includeEffectivePermissions,
                includeStandardProperties,
                includeWorkbookChildren: false,
                includeSubfolders: true,
                depth: 1,
            })
                .then(containers => {
                    let projects = containers
                        // if user doesn't have permissions to the parent/project, the response will come back with an empty Container object
                        .filter(c => c !== undefined && c.id !== '');

                    const childProjects = projects.filter(c => c.path !== topFolderPath);
                    // Issue 45805: sort folders by title as server-side sorting is insufficient
                    childProjects.sort(naturalSortByProperty('title'));

                    if (!includeTopFolder) {
                        resolve(childProjects);
                    }
                    else {
                        const top = projects.find(c => c.path === topFolderPath);
                        const allProject = top ? [top] : [];
                        allProject.push(...childProjects);
                        resolve(allProject);
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });
    };
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getFolderTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<FolderAPIWrapper> = {}
): FolderAPIWrapper {
    return {
        createProject: mockFn(),
        renameProject: mockFn(),
        updateProjectDataExclusions: mockFn(),
        getDataTypeExcludedProjects: mockFn(),
        updateProjectLookAndFeelSettings: mockFn(),
        getProjects: mockFn,
        ...overrides,
    };
}
