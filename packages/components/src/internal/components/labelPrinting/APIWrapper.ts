import { ActionURL, Ajax, Utils } from '@labkey/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { getQueryModelExportParams } from '../../../public/QueryModel/utils';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';
import { EXPORT_TYPES } from '../../constants';
import { buildURL } from '../../url/AppURL';
import { SAMPLE_EXPORT_CONFIG } from '../samples/constants';

import { selectRows } from '../../query/selectRows';

import { User } from '../base/models/User';

import { handleRequestFailure } from '../../util/utils';

import { LABEL_TEMPLATE_SQ } from './constants';
import { BarTenderConfiguration, BarTenderResponse, LabelTemplate } from './models';

function handleBarTenderConfigurationResponse(
    resolve: (value: BarTenderConfiguration | PromiseLike<BarTenderConfiguration>) => void
): Ajax.AjaxHandler {
    return Utils.getCallbackWrapper(({ btConfiguration }) => resolve(BarTenderConfiguration.create(btConfiguration)));
}

export interface LabelPrintingAPIWrapper {
    createLabelTemplateList: (containerPath?: string) => Promise<LabelTemplate[]>;
    ensureLabelTemplatesList: (user: User, containerPath?: string) => Promise<LabelTemplate[]>;
    fetchBarTenderConfiguration: (containerPath?: string) => Promise<BarTenderConfiguration>;
    getLabelTemplates: () => Promise<LabelTemplate[]>;
    printBarTenderLabels: (btxml: string, serviceURL: string) => Promise<BarTenderResponse>;
    printGridLabels: (
        sampleModel: QueryModel,
        labelFormat: string,
        numCopies: number,
        serverURL: string
    ) => Promise<BarTenderResponse>;
    saveBarTenderURLConfiguration: (
        btConfig: { serviceURL: string },
        containerPath?: string
    ) => Promise<BarTenderConfiguration>;
    saveDefaultLabelConfiguration: (btConfig: { defaultLabel: number }) => Promise<BarTenderConfiguration>;
}

export class LabelPrintingServerAPIWrapper implements LabelPrintingAPIWrapper {
    createLabelTemplateList = (containerPath?: string): Promise<LabelTemplate[]> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: buildURL(
                    SAMPLE_MANAGER_APP_PROPERTIES.controllerName,
                    'ensureLabelTemplateList.api',
                    containerPath
                ),
                method: 'POST',
                success: () => {
                    resolve([]);
                },
                failure: handleRequestFailure(reject, 'Failed to ensure label template list'),
            });
        });
    };

    // TODO: This endpoint handler does too much
    ensureLabelTemplatesList = async (user: User, containerPath?: string): Promise<LabelTemplate[]> => {
        try {
            return await this.getLabelTemplates(containerPath);
        } catch (reason) {
            if (reason.status !== 404) {
                return undefined;
            }

            if (!user.isAppAdmin()) {
                console.error(
                    'User has insufficient permissions to create the template list. Please contact administrator'
                );
                return undefined;
            }
        }

        try {
            // try to create list
            return await this.createLabelTemplateList(containerPath);
        } catch (reason) {
            console.error(reason);
            return undefined;
        }
    };

    /** Retrieve the BarTender web service configuration from the server */
    fetchBarTenderConfiguration = (containerPath?: string): Promise<BarTenderConfiguration> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL(
                    SAMPLE_MANAGER_APP_PROPERTIES.controllerName,
                    'getBarTenderConfiguration.api',
                    containerPath
                ),
                success: handleBarTenderConfigurationResponse(resolve),
                failure: handleRequestFailure(reject, 'There was a problem getting the BarTender configuration.'),
            });
        });
    };

    /**
     * Makes a request to the configured BarTender Web Service to print labels.
     * @param btxml body of request
     * @param serviceURL to make request to
     */
    printBarTenderLabels = (btxml: string, serviceURL: string): Promise<BarTenderResponse> => {
        return new Promise((resolve, reject) => {
            // Due to CORS conflicts we can't use the normal Ajax.request utility method. BT service doesn't currently support preflight OPTIONS checks to properly support CORS request.
            // So we use a custom xhr and headers, to make "simple" request. This also prevents sharing the normal custom LabKey headers.
            const xhr = new XMLHttpRequest();
            xhr.withCredentials = false; // If true, will cause the CORS policy to be triggered and we are not currently supporting auth

            xhr.addEventListener('readystatechange', function () {
                if (this.readyState === 4) {
                    const success = (xhr.status >= 200 && xhr.status < 300) || xhr.status === 304;
                    // TODO: look at this for when the response is alternatively (xml vs json) configured.
                    success ? resolve(new BarTenderResponse(JSON.parse(xhr.responseText))) : reject(xhr);
                }
            });

            xhr.open('POST', serviceURL);
            xhr.setRequestHeader('Content-Type', 'text/plain'); // This won't trigger the CORS requirements
            xhr.send(btxml);
        });
    };

    /**
     * Make request to get request body data for the BarTender print service
     * @param sampleModel of the samples to print
     * @param labelFormat filename to use with BarTender
     * @param numCopies to print
     * @param serverURL of the BarTender service
     */
    printGridLabels = (
        sampleModel: QueryModel,
        labelFormat: string,
        numCopies: number,
        serverURL: string
    ): Promise<BarTenderResponse> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'printBarTenderLabels.api'),
                params: getQueryModelExportParams(sampleModel, EXPORT_TYPES.LABEL, {
                    ...SAMPLE_EXPORT_CONFIG,
                    labelFormat,
                    numCopies,
                    // We override the showRows value because of the strange default behavior for grid export that
                    // exports all rows if you can have selections but have selected no items in the grid
                    'query.showRows': ['SELECTED'],
                }),
                success: request => {
                    this.printBarTenderLabels(request.response, serverURL).then(resolve).catch(reject);
                },
                failure: handleRequestFailure(reject, 'Failed to print BarTender labels'),
            });
        });
    };

    /**
     * Save the BarTender configuration to server properties
     */
    saveBarTenderURLConfiguration = (
        btConfig: { serviceURL: string },
        containerPath?: string
    ): Promise<BarTenderConfiguration> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL(
                    SAMPLE_MANAGER_APP_PROPERTIES.controllerName,
                    'saveBarTenderURLConfiguration.api',
                    containerPath
                ),
                method: 'POST',
                jsonData: { serviceURL: btConfig.serviceURL },
                success: handleBarTenderConfigurationResponse(resolve),
                failure: handleRequestFailure(reject, 'Error saving BarTender service URL'),
            });
        });
    };

    saveDefaultLabelConfiguration = (btConfig: { defaultLabel: number }): Promise<BarTenderConfiguration> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL(
                    SAMPLE_MANAGER_APP_PROPERTIES.controllerName,
                    'saveDefaultLabelConfiguration.api'
                ),
                method: 'POST',
                jsonData: { defaultLabel: btConfig.defaultLabel },
                success: handleBarTenderConfigurationResponse(resolve),
                failure: handleRequestFailure(reject, 'Error saving the Default Label selection'),
            });
        });
    };

    getLabelTemplates = async (containerPath?: string): Promise<LabelTemplate[]> => {
        const result = await selectRows({ containerPath, schemaQuery: LABEL_TEMPLATE_SQ });
        return result.rows.map(row => LabelTemplate.create(row));
    };
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getLabelPrintingTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<LabelPrintingAPIWrapper> = {}
): LabelPrintingAPIWrapper {
    return {
        createLabelTemplateList: mockFn(),
        ensureLabelTemplatesList: () => Promise.resolve([]),
        fetchBarTenderConfiguration: () =>
            Promise.resolve(
                new BarTenderConfiguration({
                    serviceURL: '',
                })
            ),
        getLabelTemplates: () => Promise.resolve([]),
        printBarTenderLabels: mockFn(),
        printGridLabels: mockFn(),
        saveBarTenderURLConfiguration: mockFn(),
        saveDefaultLabelConfiguration: mockFn(),
        ...overrides,
    };
}
