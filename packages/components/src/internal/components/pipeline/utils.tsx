import React from 'react';

import { AppURL } from '../../url/AppURL';
import {App, AssayDefinitionModel, AssayUploadResultModel} from '../../../index';

export function getSuccessMsg(
    response: AssayUploadResultModel,
    isBackgroundJob: boolean,
    reimport: boolean,
    assayDefinition: AssayDefinitionModel = null
): JSX.Element {
    console.log("getSuccessMsg isBackgroundJob", isBackgroundJob);
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

export function getPipelineLinkMsg(response: AssayUploadResultModel): JSX.Element {
    return (
        <>
            Click{' '}
            <a href={AppURL.create('pipeline', response.jobId).toHref()}>  here </a> to check the status of the background
            import.{' '}
        </>
    );
}

export function getWorkflowLinkMsg(workflowJobId, workflowTaskId): JSX.Element {
    if (workflowJobId) {
        let jobTasksUrl = AppURL.create(App.WORKFLOW_KEY, workflowJobId, 'tasks');
        if (workflowTaskId) {
            jobTasksUrl = jobTasksUrl.addParams({
                taskId: workflowTaskId,
            });
        }

        return (
            <>
                Click
                <a href={jobTasksUrl.toHref()} className="alert-link"> here </a>
                to go back to the workflow task.
            </>
        );
    }
    return null;
}

export function getImportNotificationMsg(
    response: AssayUploadResultModel,
    isBackgroundJob: boolean,
    reimport: boolean,
    assayDefinition: AssayDefinitionModel,
    workflowJobId,
    workflowTaskId
): JSX.Element {
    return (
        <span>
            {getSuccessMsg(response, isBackgroundJob, reimport, assayDefinition)}
            {isBackgroundJob ? getPipelineLinkMsg(response) : null}
            {!assayDefinition ? getWorkflowLinkMsg(workflowJobId, workflowTaskId) : null}
        </span>
    );
}
