import React, { ReactNode } from 'react';

import { ACTIVE_JOB_INDICATOR_CLS } from '../pipeline/constants';

import { Tip } from './Tip';

export function getTitleDisplay(content: ReactNode, hasActivePipelineJob: boolean): ReactNode {
    return hasActivePipelineJob ? (
        <>
            <Tip caption="Background import in progress">
                <i className={'fa ' + ACTIVE_JOB_INDICATOR_CLS} />
            </Tip>
            <span className="page-detail-header-title-padding">{content}</span>
        </>
    ) : (
        content
    );
}
