import React, { ReactNode } from 'react';

import { AssayDefinitionModel } from '../internal/AssayDefinitionModel';
import { AppURL } from '../internal/url/AppURL';
import { ASSAYS_KEY, WORKFLOW_KEY } from '../internal/app/constants';
import { AssayUploadResultModel } from '../internal/components/assay/models';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

function getPipelineLinkMsg(response: AssayUploadResultModel): ReactNode {
    return (
        <>
            Click <a href={AppURL.create('pipeline', response.jobId).toHref()}> here </a> to check the status of the
            background import.{' '}
        </>
    );
}

function getWorkflowLinkMsg(workflowJobId?: string, workflowTaskId?: string): ReactNode {
    if (workflowJobId) {
        let jobTasksUrl = AppURL.create(WORKFLOW_KEY, workflowJobId, 'tasks');
        if (workflowTaskId) {
            jobTasksUrl = jobTasksUrl.addParams({
                taskId: workflowTaskId,
            });
        }

        return (
            <>
                Click
                <a href={jobTasksUrl.toHref()} className="alert-link">
                    {' '}
                    here{' '}
                </a>
                to go back to the workflow task.
            </>
        );
    }
    return null;
}

function getAssayImportSuccessMsg(
    runId: number,
    isBackgroundJob: boolean,
    reimport: boolean,
    assayDefinition: AssayDefinitionModel = null
): ReactNode {
    if (!isBackgroundJob) {
        const msg = `Successfully ${reimport ? 're-imported' : 'created'} assay run`;
        if (assayDefinition) {
            // Displayed if 'Save and Import Another Run' chosen
            const href = AppURL.create(ASSAYS_KEY, assayDefinition.type, assayDefinition.name, 'runs', runId).toHref();
            return (
                <>
                    {msg} <a href={href}>#{runId}</a>.{' '}
                </>
            );
        } else {
            // Displayed if 'Save and Finish' chosen
            return <> {msg}. </>;
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
): ReactNode {
    return (
        <span>
            {getAssayImportSuccessMsg(response.runId, isBackgroundJob, reimport, assayDefinition)}
            {isBackgroundJob ? getPipelineLinkMsg(response) : null}
            {!assayDefinition ? getWorkflowLinkMsg(workflowJobId, workflowTaskId) : null}
        </span>
    );
}

export function getAssayRunDeleteMessage(canDelete: boolean, deleteInfoError: boolean): ReactNode {
    let deleteMsg;
    if (canDelete === undefined) {
        deleteMsg = <LoadingSpinner msg="Loading delete confirmation data..." />;
    } else if (!canDelete) {
        deleteMsg = 'This assay run cannot be deleted because ';
        if (deleteInfoError) {
            deleteMsg += 'there was a problem loading the delete confirmation data.';
        } else {
            deleteMsg += 'it has references in one or more active notebooks.';
        }
    }
    return deleteMsg;
}
