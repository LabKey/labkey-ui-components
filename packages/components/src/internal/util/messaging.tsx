import React, { ReactNode } from 'react';

import { capitalizeFirstChar } from './utils';

// TODO rename as actionErrorMessage
export function getActionErrorMessage(problemStatement: string, noun: string, showRefresh = true): React.ReactNode {
    return (
        <span>
            {problemStatement}
            &nbsp;Your session may have expired or the {noun} may no longer be valid.
            {showRefresh && (
                <>
                    &nbsp;Try <a onClick={() => window.location.reload()}>refreshing the page</a>.
                </>
            )}
        </span>
    );
}

export function deleteSuccessMessage(noun: string, count?: number, additionalInfo?: string): string {
    const countStr = count === undefined ? '' : count;
    return 'Successfully deleted ' + countStr + ' ' + noun + '. ' + (additionalInfo || '');
}

export function deleteErrorMessage(noun: string): ReactNode {
    return getActionErrorMessage('There was a problem deleting the ' + noun + '. ', noun);
}

const IllegalArgumentMessage = 'java.lang.illegalargumentexception:';
const ClassCastMessage = 'cannot be cast to class';
const NullPointerExceptionMessage = 'java.lang.nullpointerexception';
const ExperimentExceptionMessage = 'org.labkey.api.exp.experimentexception:';

function trimExceptionPrefix(exceptionMessage: string, message: string): string {
    const startIndex = message.toLowerCase().indexOf(exceptionMessage);
    return message.substring(startIndex + exceptionMessage.length).trim();
}

export function resolveErrorMessage(error: any, noun = 'data', nounPlural?: string, verb?: string): string {
    let errorMsg;
    if (!error) {
        return undefined;
    }
    if (typeof error === 'string') {
        errorMsg = error;
    } else if (error.message) {
        errorMsg = error.message;
    } else if (error.msg) {
        errorMsg = error.msg;
    } else if (error.exception) {
        errorMsg = error.exception;
    }
    if (errorMsg) {
        const lcMessage = errorMsg.toLowerCase();
        if (
            lcMessage.indexOf('violates unique constraint') >= 0 ||
            lcMessage.indexOf('violation of unique key constraint') >= 0 ||
            lcMessage.indexOf('cannot insert duplicate key row') >= 0
        ) {
            let match = errorMsg.match(/=\(.+?, .+?, (.+?)\) already exists./);
            let retMsg = `There was a problem ${verb || 'creating'} your ${noun || 'data'}.`;
            if (match) {
                retMsg += ` Duplicate name '${match[1]}' found.`;
            } else {
                match = errorMsg.match(/duplicate key value is \(.+?, .+?, (.*?)\)./);
                if (match) {
                    retMsg += ` Duplicate name '${match[1]}' found.`;
                } else {
                    retMsg += ` Check the existing ${nounPlural || noun} for possible duplicates and make sure any referenced ${nounPlural || noun} are still valid.`
                }
            }
            return retMsg;
        } else if (
            lcMessage.indexOf('violates foreign key constraint') >= 0 ||
            lcMessage.indexOf('conflicted with the foreign key constraint') >= 0
        ) {
            return `There was a problem ${verb || 'creating'} your ${noun || 'data'}. Check the data fields to make
            sure they contain or reference valid values.`;
        } else if (lcMessage.indexOf('bad sql grammar') >= 0 || lcMessage.indexOf(ClassCastMessage) >= 0) {
            return `There was a problem ${verb || 'creating'} your ${
                noun || 'data'
            }.  Check that the format of the data matches the expected type for each field.`;
        } else if (lcMessage.indexOf('existing row was not found') >= 0) {
            return `We could not find the ${noun || 'data'} ${
                verb ? 'to ' + verb : ''
            }.  Try refreshing your page to see if it has been deleted.`;
        } else if (
            lcMessage.indexOf('communication failure') >= 0 ||
            lcMessage.match(/query.*in schema.*doesn't exist/) !== null ||
            lcMessage.match(/query.*in schema.*does not exist/) !== null
        ) {
            return `There was a problem ${verb || 'retrieving'} your ${
                noun || 'data'
            }. Your session may have expired or the ${
                noun || 'data'
            } may no longer be valid.  Try refreshing your page.`;
        } else if (lcMessage.indexOf('either rowid or lsid is required') >= 0) {
            return `There was a problem ${verb || 'retrieving or updating'} your ${
                noun || 'data'
            }.  The request did not contain the proper identifiers.  Make sure the ${noun || 'data'} are still valid.`;
        } else if (lcMessage.indexOf('unable to set genid to ') === 0) {
            // genId display value should be 1 larger than DB value
            const prefix = 'Unable to set genId to ';
            const numberEndInd = lcMessage.indexOf(' ', prefix.length + 1);
            const numberStr = lcMessage.substring(prefix.length, numberEndInd);
            return prefix + (parseInt(numberStr) + 1) + lcMessage.substring(numberEndInd);
        } else if (lcMessage.indexOf(IllegalArgumentMessage) >= 0) {
            return trimExceptionPrefix(IllegalArgumentMessage, errorMsg);
        } else if (lcMessage.indexOf('at least one of "file", "runfilepath", or "datarows" is required') >= 0) {
            return `No data provided for ${verb || 'import'}.`;
        } else if (lcMessage.indexOf(NullPointerExceptionMessage) >= 0) {
            return `There was a problem ${verb || 'processing'} your ${
                noun || 'data'
            }. This may be a problem in the application. Contact your administrator.`;
        } else if (lcMessage.indexOf(ExperimentExceptionMessage) >= 0) {
            return trimExceptionPrefix(ExperimentExceptionMessage, errorMsg);
        } else if (lcMessage.indexOf("cannot update data that don't belong to the current container.") >= 0) {
            return `There was a problem ${verb || 'importing'} your ${noun.toLowerCase() || 'data'}. One or more ${
                noun.toLowerCase() || 'data'
            } already exist in a different project.`;
        } else if (lcMessage.indexOf('inventory:item: row: ') >= 0) {
            return trimExceptionPrefix('inventory:item: row: ', errorMsg);
        }
    }
    return errorMsg;
}

export function getConfirmDeleteMessage(verbNoun = 'Deletion'): ReactNode {
    return (
        <p className="top-spacing">
            <strong>{capitalizeFirstChar(verbNoun)} cannot be undone.</strong>
            &nbsp;Do you want to proceed?
        </p>
    );
}
