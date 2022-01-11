import { Ajax, Utils } from '@labkey/api';

import {AppURL, buildURL} from '../../url/AppURL';
import { InferDomainResponse } from '../../../public/InferDomainResponse';
import { processRequest } from '../../query/api';
import {AssayUploadResultModel} from "./models";
import {AssayDefinitionModel} from "../../AssayDefinitionModel";
import {App} from "../../../index";
import React from "react";
import {getPipelineLinkMsg, getWorkflowLinkMsg} from "../pipeline/utils";

export function inferDomainFromFile(
    file: File,
    numLinesToInclude: number,
    domainKindName?: string
): Promise<InferDomainResponse> {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('file', file);
        form.append('numLinesToInclude', numLinesToInclude ? (numLinesToInclude + 1).toString() : undefined);
        if (domainKindName) {
            form.append('domainKindName', domainKindName);
        }

        Ajax.request({
            url: buildURL('property', 'inferDomain'),
            method: 'POST',
            form,
            success: Utils.getCallbackWrapper((response, request) => {
                if (processRequest(response, request, reject)) return;
                resolve(InferDomainResponse.create(response));
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error(error);
                reject(
                    'There was a problem determining the fields in the uploaded file.  Please check the format of the file.'
                );
            }),
        });
    });
}

/**
 * This is used for retrieving preview data for a file already on the server side
 * @param file  This can be a rowId for the file, or a path to the file
 * @param numLinesToInclude: the number of lines of data to include (excludes the header)
 */
export function getServerFilePreview(file: string, numLinesToInclude: number): Promise<InferDomainResponse> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('property', 'getFilePreview.api'),
            method: 'GET',
            params: {
                file,
                numLinesToInclude: numLinesToInclude ? numLinesToInclude + 1 : undefined, // add one to account for the header
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(InferDomainResponse.create(response));
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject('There was a problem retrieving the preview data.');
                console.error(response);
            }),
        });
    });
}

function getAssayImportSuccessMsg(
    response: AssayUploadResultModel,
    isBackgroundJob: boolean,
    reimport: boolean,
    assayDefinition: AssayDefinitionModel = null
): JSX.Element {
    if (!isBackgroundJob) {
        const msg = `Successfully ${reimport ? 're-imported' : 'created'} assay run`;
        if (assayDefinition) {
            // Displayed if 'Save and Import Another Run' chosen
            const href = AppURL.create(
                App.ASSAYS_KEY,
                assayDefinition.type,
                assayDefinition.name,
                'runs',
                response.runId
            ).toHref();
            return (
                <>
                    {msg} <a href={href}>#{response.runId}</a>.{' '}
                </>
            );
        } else {
            // Displayed if 'Save and Finish' chosen
            return <> {msg}.{' '} </>;
        }
    } else {
        return (
            <>
                Successfully started {reimport ? 're-importing' : 'creating'} assay run. You'll be notified when it's
                done.{' '}
            </>
        );
    }
}

export function getAssayImportNotificationMsg(
    response: AssayUploadResultModel,
    isBackgroundJob: boolean,
    reimport: boolean,
    assayDefinition: AssayDefinitionModel,
    workflowJobId?: string,
    workflowTaskId?: string
): JSX.Element {
    return (
        <span>
            {getAssayImportSuccessMsg(response, isBackgroundJob, reimport, assayDefinition)}
            {isBackgroundJob ? getPipelineLinkMsg(response) : null}
            {!assayDefinition ? getWorkflowLinkMsg(workflowJobId, workflowTaskId) : null}
        </span>
    );
}
