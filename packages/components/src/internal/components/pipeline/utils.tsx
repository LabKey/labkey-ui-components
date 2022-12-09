import React, { ReactNode } from 'react';
import { Utils } from '@labkey/api';

import { ProductMenuModel } from '../navigation/model';
import { Tip } from '../base/Tip';

import { ACTIVE_JOB_INDICATOR_CLS } from './constants';

export function hasActivePipelineJob(menu: ProductMenuModel, sectionKey: string, itemLabel: string): boolean {
    if (!menu.isLoaded) return false;

    const section = menu.getSection(sectionKey);
    if (section) {
        const menuItem = section.items.find(set => Utils.caseInsensitiveEquals(set.get('label'), itemLabel));
        return menuItem?.hasActiveJob;
    }

    return false;
}

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
