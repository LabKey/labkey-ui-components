import React, { ReactNode } from 'react';
import {Tip} from "./Tip";
import {ACTIVE_JOB_INDICATOR_CLS} from "../pipeline/constants";

export function getTitleDisplay(content: ReactNode, hasActiveJob: boolean) : ReactNode {
    return hasActiveJob ? (<>
        <Tip caption={'Background import in progress'}>
            <i className={'fa ' + ACTIVE_JOB_INDICATOR_CLS}/>
        </Tip>
        <span className={'page-detail-header-title-padding'}>{content}</span>
    </>) : content;
}
