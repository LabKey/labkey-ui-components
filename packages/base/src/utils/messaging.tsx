import * as React from 'react';

export function getActionErrorMessage(problemStatement: string, noun: string) : React.ReactNode
{
    return (
        <span>
            {problemStatement}
            Your session may have expired or the {noun} may no longer be valid.
            Try <a onClick={() => window.location.reload()}>refreshing the page</a>.
        </span>
    )
}