import { ActionURL, Ajax, Utils } from '@labkey/api';

import { BarTenderConfiguration, BarTenderResponse } from './models';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { getQueryModelExportParams } from '../../../public/QueryModel/utils';
import { EXPORT_TYPES } from '../../constants';
import { SAMPLE_EXPORT_CONFIG } from '../samples/constants';
import { buildURL } from '../../url/AppURL';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

/**
 * Parse the response from the BarTenderConfiguration apis
 * @param response object from the api
 */
function handleBarTenderConfigurationResponse(response: any): BarTenderConfiguration {
    // Separate the BarTender configuration object from the success response
    const { btConfiguration } = response;
    return new BarTenderConfiguration(btConfiguration);
}

/**
 * Retrieve the BarTender web service configuration from the server
 */
export function fetchBarTenderConfiguration(): Promise<BarTenderConfiguration> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'getBarTenderConfiguration.api'),
            method: 'GET',
            success: Utils.getCallbackWrapper(response => resolve(handleBarTenderConfigurationResponse(response))),
            failure: Utils.getCallbackWrapper(resp => {
                console.error(resp);
                reject('There was a problem getting the BarTender configuration.');
            }),
        });
    });
}

/**
 * Save the BarTender configuration to server properties
 * @param btConfig
 */
export function saveBarTenderConfiguration(btConfig: BarTenderConfiguration): Promise<BarTenderConfiguration> {
    return new Promise((resolve, reject) => {
        const params = { serviceURL: btConfig.serviceURL, defaultLabel: btConfig.defaultLabel };

        Ajax.request({
            url: ActionURL.buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'saveBarTenderConfiguration.api'),
            method: 'POST',
            jsonData: params,
            success: Utils.getCallbackWrapper(response => resolve(handleBarTenderConfigurationResponse(response))),
            failure: Utils.getCallbackWrapper(resp => {
                console.error(resp);
                reject('Error saving BarTender configuration');
            }),
        });
    });
}


/**
 * Makes a request to the configured BarTender Web Service to print labels.
 * @param btxml body of request
 * @param serviceURL to make request to
 */
export function printBarTenderLabels(btxml:string, serviceURL:string): Promise<BarTenderResponse> {
    return new Promise((resolve, reject) => {
        // Due to CORS conflicts we can't use the normal Ajax.request utility method. BT service doesn't currently support preflight OPTIONS checks to properly support CORS request.
        // So we use a custom xhr and headers, to make "simple" request. This also prevents sharing the normal custom LabKey headers.
        const data = btxml;
        const xhr = new XMLHttpRequest();
        xhr.withCredentials = false;     //If true, will cause the CORS policy to be triggered and we are not currently supporting auth

        xhr.addEventListener("readystatechange", function() {
            if(this.readyState === 4) {
                const success = (xhr.status >= 200 && xhr.status < 300) || xhr.status === 304;
                //TODO: look at this for when the response is alternatively (xml vs json) configured.
                success ? resolve(new BarTenderResponse(JSON.parse(xhr.responseText))) : reject(xhr);
            }
        });

        xhr.open("POST", serviceURL);
        xhr.setRequestHeader("Content-Type", "text/plain");  // This won't trigger the CORS requirements

        xhr.send(data);
    });
}

/**
 * Make request to get request body data for the BarTender print service
 * @param sampleModel of the samples to print
 * @param labelFormat filename to use with BarTender
 * @param numCopies to print
 * @param serverURL of the BarTender service
 */
export function printGridLabels(sampleModel: QueryModel, labelFormat: string, numCopies: number, serverURL: string, ) : Promise<BarTenderResponse> {
    // We override the showRows value because of the strange default behavior for grid export that
    // exports all rows if you can have selections but have selected no items in the grid
    const params = getQueryModelExportParams(sampleModel, EXPORT_TYPES.LABEL, {...SAMPLE_EXPORT_CONFIG, ['query.showRows']: ['SELECTED'], labelFormat, numCopies})
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, "printBarTenderLabels.api", undefined, { returnUrl: false }),
            method: 'GET',
            params,
            success: (request: XMLHttpRequest) =>  {
                const btxml = request.response;
                printBarTenderLabels(btxml, serverURL)
                    .then(resolve)
                    .catch(reject);
            },
            failure: Utils.getCallbackWrapper(response => {
                reject(response)
            })
        })
    });
}
