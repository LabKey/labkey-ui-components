import React from 'react';

import { AppURL } from '../../url/AppURL';
import { App, AssayUploadResultModel } from '../../../index';

export function renderWorkflowLinkMsg(workflowJobId, workflowTaskId) {
    if (workflowJobId) {
        let jobTasksUrl = AppURL.create(App.WORKFLOW_KEY, workflowJobId, 'tasks');
        if (workflowTaskId) {
            jobTasksUrl = jobTasksUrl.addParams({
                taskId: workflowTaskId,
            });
        }

        return (
            <>
                {' Click '}
                <a href={jobTasksUrl.toHref()} className="alert-link">
                    here
                </a>
                {' to go back to the workflow task.'}
            </>
        );
    }
    return null;
}

export function getSuccessMsg(
    response: AssayUploadResultModel,
    isBackgroundJob: boolean,
    reimport: boolean
): string | JSX.Element {
    if (!isBackgroundJob) {
        const verb = reimport ? 're-imported' : 'created';
        return `Successfully ${verb} assay run`;
    } else {
        const verb = reimport ? 're-importing' : 'creating';
        return (
            <>
                Successfully started {verb} assay run.&nbsp;You'll be notified when it's done.&nbsp; Click{' '}
                <a href={AppURL.create('pipeline', response.jobId).toHref()} className="alert-link">here</a> to check the status of the
                background import
            </>
        );
    }
}
