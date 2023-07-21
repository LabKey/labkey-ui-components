import { ActionURL, Ajax, Utils } from '@labkey/api';

import { Container } from '../base/models/Container';
import { handleRequestFailure } from '../../util/utils';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';
import { ProjectConfigurableDataType } from '../entities/models';

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
    createProject: (options: ProjectSettingsOptions) => Promise<Container>;
    getDataTypeExcludedProjects: (dataType: ProjectConfigurableDataType, dataTypeRowId: number) => Promise<string[]>;
    renameProject: (options: ProjectSettingsOptions) => Promise<Container>;
    updateProjectDataExclusions: (options: ProjectSettingsOptions) => Promise<void>;
    updateProjectLookAndFeelSettings: (options: UpdateProjectSettingsOptions) => Promise<void>;
}

export class ServerFolderAPIWrapper implements FolderAPIWrapper {
    createProject = (options: ProjectSettingsOptions): Promise<Container> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'createProject.api'),
                method: 'POST',
                jsonData: options,
                success: Utils.getCallbackWrapper(({ project }) => {
                    resolve(new Container(project));
                }),
                failure: handleRequestFailure(reject, 'Failed to create project'),
            });
        });
    };

    renameProject = (options: ProjectSettingsOptions): Promise<Container> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'renameProject.api'),
                method: 'POST',
                jsonData: options,
                success: Utils.getCallbackWrapper(({ data }) => {
                    resolve(new Container(data.project));
                }),
                failure: handleRequestFailure(reject, 'Failed to rename project'),
            });
        });
    };

    updateProjectDataExclusions = (options: ProjectSettingsOptions): Promise<void> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'updateProjectDataExclusion.api'),
                method: 'POST',
                jsonData: options,
                success: Utils.getCallbackWrapper(({ data }) => {
                    resolve();
                }),
                failure: handleRequestFailure(reject, 'Failed to update project data type'),
            });
        });
    };

    updateProjectLookAndFeelSettings = (options: UpdateProjectSettingsOptions): Promise<void> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL('admin', 'updateProjectSettings.api'),
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
        ...overrides,
    };
}
