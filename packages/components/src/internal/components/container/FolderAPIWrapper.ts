import { ActionURL, Ajax, Utils } from '@labkey/api';

import { Container } from '../base/models/Container';
import { handleRequestFailure } from '../../util/utils';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

export interface ProjectSettingsOptions {
    allowUserSpecifiedNames?: boolean;
    disabledAssayDesigns?: number[];
    disabledDataClasses?: number[];
    disabledSampleTypes?: number[];
    disabledStorages?: number[];
    name?: string;
    nameAsTitle?: boolean;
    prefix?: string;
    title?: string;
}

export interface FolderAPIWrapper {
    createProject: (options: ProjectSettingsOptions) => Promise<Container>;
    renameProject: (options: ProjectSettingsOptions) => Promise<Container>;
    updateProjectDataType: (options: ProjectSettingsOptions) => Promise<void>;
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

    updateProjectDataType = (options: ProjectSettingsOptions): Promise<void> => {
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
        updateProjectDataType: mockFn(),
        ...overrides,
    };
}
