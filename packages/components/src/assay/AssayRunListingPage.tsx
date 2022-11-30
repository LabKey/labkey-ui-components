import React, { FC } from 'react';

import { InjectedAssayModel } from '../internal/components/assay/withAssayModels';
import { InjectedRouteLeaveProps, withRouteLeave } from '../internal/util/RouteLeave';
import { CommonPageProps } from '../internal/models';
import { Page } from '../internal/components/base/Page';

import { AssayLink } from '../internal/AssayDefinitionModel';

import { isWorkflowEnabled } from '../internal/app/utils';

import { RUN_PROPERTIES_REQUIRED_COLUMNS } from '../internal/components/assay/constants';

import { useServerContext } from '../internal/components/base/ServerContext';

import { AssayHeader } from './AssayHeader';
import { AssayDesignHeaderButtons } from './AssayButtons';
import { AssayOverrideBanner } from './AssayOverrideBanner';
import { AssayGridPanel } from './AssayGridPanel';

import { assayPage } from './AssayPageHOC';

const AssayRunListingPageImpl: FC<CommonPageProps & InjectedAssayModel & InjectedRouteLeaveProps> = props => {
    const { assayDefinition, assayProtocol, menu, menuInit, navigate, getIsDirty, setIsDirty } = props;
    const { moduleContext } = useServerContext();
    const subTitle = 'Assay Runs';

    return (
        <Page title={assayDefinition.name + ' - ' + subTitle} hasHeader>
            <AssayHeader menu={menu} subTitle={subTitle} description={assayDefinition.description}>
                <AssayDesignHeaderButtons menuInit={menuInit} navigate={navigate} />
            </AssayHeader>
            <AssayOverrideBanner assay={assayDefinition} link={AssayLink.RUNS} />
            <AssayGridPanel
                setIsDirty={setIsDirty}
                getIsDirty={getIsDirty}
                assayDefinition={assayDefinition}
                protocol={assayProtocol}
                canDelete={true}
                canUpdate={assayProtocol.editableRuns}
                queryName="Runs"
                nounPlural="Runs"
                requiredColumns={
                    isWorkflowEnabled(moduleContext) ? RUN_PROPERTIES_REQUIRED_COLUMNS.toArray() : undefined
                }
            />
        </Page>
    );
};

export const AssayRunListingPage = withRouteLeave(assayPage(AssayRunListingPageImpl));
