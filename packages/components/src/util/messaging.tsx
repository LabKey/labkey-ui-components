import React from 'react';

export function getActionErrorMessage(problemStatement: string, noun: string, showRefresh : boolean = true) : React.ReactNode
{
    return (
        <span>
            {problemStatement}
            &nbsp;Your session may have expired or the {noun} may no longer be valid.
            {showRefresh && <>&nbsp;Try <a onClick={() => window.location.reload()}>refreshing the page</a>.</>}
        </span>
    )
}
