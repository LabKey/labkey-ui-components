import React from 'react';
export const SAMPLE_INSERT_FAILURE_MESSAGE = "There was a problem creating your samples. Check your existing samples for possible duplicate Sample IDs and make sure any referenced parent samples are still valid.";

export function getActionErrorMessage(problemStatement: string, noun: string, showRefresh : boolean = true) : React.ReactNode {
    return (
        <span>
            {problemStatement}
            &nbsp;Your session may have expired or the {noun} may no longer be valid.
            {showRefresh && <>&nbsp;Try <a onClick={() => window.location.reload()}>refreshing the page</a>.</>}
        </span>
    )
}


export function resolveErrorMessage(error: any, noun: string, defaultMsg?: React.ReactNode) : React.ReactNode {
    let errorMsg;
    if (typeof error == 'string') {
        errorMsg = error;
    } else if (error.message) {
        errorMsg = error.message;
    }
    else if (error.exception) {
        errorMsg = error.exception;
    }
    else if (error.error && error.error.exception) {
        errorMsg = error.exception;
    }
    if (errorMsg) {
        const lcMessage = errorMsg.toLowerCase();
        if (lcMessage.indexOf('violates unique constraint ') >= 0)
            return defaultMsg;
        else if (lcMessage.indexOf('existing row was not found') >= 0) {
            return 'The ' + noun + ' was not found.  It may have been deleted by another user.';
        }
        else if (lcMessage.indexOf('communication failure') >= 0) {
            return getActionErrorMessage("There was a problem retrieving data.", "data");
        }
    }
    return errorMsg;
}
