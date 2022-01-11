import React from 'react';

import { AppURL } from '../../url/AppURL';
import { App, AssayUploadResultModel } from '../../../index';

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
