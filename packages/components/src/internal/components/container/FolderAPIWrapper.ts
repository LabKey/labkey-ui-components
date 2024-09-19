import { ActionURL, Ajax, Utils } from '@labkey/api';

import { Container } from '../base/models/Container';
import { handleRequestFailure } from '../../util/utils';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';
import { FolderConfigurableDataType } from '../entities/models';
import { getFolderDataTypeExclusions } from '../entities/actions';
import { isAppHomeFolder } from '../../app/utils';
import { fetchContainers } from '../permissions/actions';
import { ModuleContext } from '../base/ServerContext';
import { naturalSortByProperty } from '../../../public/sort';
import { HOME_PATH, HOME_TITLE } from '../navigation/constants';

export interface FolderSettingsOptions {
    allowUserSpecifiedNames?: boolean;
    disabledAssayDesigns?: number[];
    disabledDashboardSampleTypes?: number[];
    disabledDataClasses?: number[];
    disabledSampleTypes?: number[];
    disabledStorageLocations?: number[];
    name?: string;
    nameAsTitle?: boolean;
    prefix?: string;
    title?: string;
}

export interface UpdateProjectSettingsOptions {
    defaultDateFormat?: string;
    defaultDateTimeFormat?: string;
    defaultTimeFormat?: string;
}

export interface AuditSettingsResponse {
    requireUserComments: boolean;
}

export interface FolderAPIWrapper {
    createProject: (options: FolderSettingsOptions, containerPath?: string) => Promise<Container>;
    getAuditSettings: (containerPath?: string) => Promise<AuditSettingsResponse>;
    getDataTypeExcludedProjects: (dataType: FolderConfigurableDataType, dataTypeRowId: number) => Promise<string[]>;
    getFolderDataTypeExclusions: (excludedContainer?: string) => Promise<{ [key: string]: number[] }>;
    getProjects: (
        container?: Container,
        moduleContext?: ModuleContext,
        includeStandardProperties?: boolean,
        includeEffectivePermissions?: boolean,
        includeTopFolder?: boolean
    ) => Promise<Container[]>;
    renameProject: (options: FolderSettingsOptions, containerPath?: string) => Promise<Container>;
    setAuditCommentsRequired: (isRequired: boolean, containerPath?: string) => Promise<void>;
    updateProjectCustomLabels: (
        labelProvider: string,
        labels: Record<string, string>,
        containerPath?: string
    ) => Promise<void>;
    updateProjectDataExclusions: (options: FolderSettingsOptions, containerPath?: string) => Promise<void>;
    updateProjectLookAndFeelSettings: (options: UpdateProjectSettingsOptions, containerPath?: string) => Promise<void>;
}

export class ServerFolderAPIWrapper implements FolderAPIWrapper {
    createProject = (options: FolderSettingsOptions, containerPath?: string): Promise<Container> => {
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

    renameProject = (options: FolderSettingsOptions, containerPath?: string): Promise<Container> => {
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

    getAuditSettings = (containerPath?: string): Promise<AuditSettingsResponse> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL('audit', 'getAuditSettings', containerPath),
                method: 'POST',
                success: Utils.getCallbackWrapper(response => {
                    resolve(response);
                }),
                failure: handleRequestFailure(reject, 'Failed to retrieve audit settings.'),
            });
        });
    };

    setAuditCommentsRequired = (requireUserComments: boolean, containerPath?: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL('audit', 'saveAuditSettings', containerPath),
                method: 'POST',
                jsonData: { requireUserComments },
                success: Utils.getCallbackWrapper(() => {
                    resolve();
                }),
                failure: handleRequestFailure(reject, 'Failed to save setting for audit comment requirements.'),
            });
        });
    };

    updateProjectDataExclusions = (options: FolderSettingsOptions, containerPath?: string): Promise<void> => {
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

    getDataTypeExcludedProjects = (dataType: FolderConfigurableDataType, dataTypeRowId: number): Promise<string[]> => {
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
                    const projects = containers
                        // if user doesn't have permissions to the parent/project, the response will come back with an empty Container object
                        .filter(c => c !== undefined && c.id !== '');

                    const childProjects = projects.filter(c => c.path !== topFolderPath);
                    // Issue 45805: sort folders by title as server-side sorting is insufficient
                    childProjects.sort(naturalSortByProperty('title'));

                    if (!includeTopFolder) {
                        resolve(childProjects);
                    } else {
                        const top = projects.find(c => c.path === topFolderPath);
                        const allProject = top
                            ? [{ ...top, title: top.path === HOME_PATH ? HOME_TITLE : top.title } as Container]
                            : [];
                        allProject.push(...childProjects);
                        resolve(allProject);
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });
    };

    getFolderDataTypeExclusions = getFolderDataTypeExclusions;

    updateProjectCustomLabels = (
        labelProvider: string,
        labels: Record<string, string>,
        containerPath?: string
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL('core', 'customLabels.api', containerPath),
                method: 'POST',
                jsonData: {
                    provider: labelProvider,
                    labelsJson: JSON.stringify(labels),
                },
                success: Utils.getCallbackWrapper(({ data }) => {
                    resolve();
                }),
                failure: handleRequestFailure(reject, 'Failed to update project custom labels.'),
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
        getAuditSettings: mockFn(),
        setAuditCommentsRequired: mockFn(),
        updateProjectDataExclusions: mockFn(),
        getDataTypeExcludedProjects: mockFn(),
        getFolderDataTypeExclusions: mockFn(),
        updateProjectLookAndFeelSettings: mockFn(),
        updateProjectCustomLabels: mockFn(),
        getProjects: mockFn(),
        ...overrides,
    };
}
