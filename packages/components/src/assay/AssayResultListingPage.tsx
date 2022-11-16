import React, { FC } from 'react';

import { InjectedAssayModel } from '../internal/components/assay/withAssayModels';
import { InjectedRouteLeaveProps, withRouteLeave } from '../internal/util/RouteLeave';
import { Page } from '../internal/components/base/Page';

import { AssayLink } from '../internal/AssayDefinitionModel';

import { CommonPageProps } from '../internal/models';

import { AssayHeader } from './AssayHeader';
import { AssayDesignHeaderButtons } from './AssayButtons';
import { AssayGridPanel } from './AssayGridPanel';
import { AssayOverrideBanner } from './AssayOverrideBanner';

import { assayPage } from './AssayPageHOC';

const AssayResultListingPageImpl: FC<CommonPageProps & InjectedAssayModel & InjectedRouteLeaveProps> = props => {
    const { assayDefinition, assayProtocol, setIsDirty, getIsDirty, menu, menuInit, navigate } = props;

    const subTitle = 'Assay Results';

    return (
        <Page title={assayDefinition.name + ' - ' + subTitle} hasHeader={true}>
            <AssayHeader menu={menu} subTitle={subTitle} description={assayDefinition.description}>
                <AssayDesignHeaderButtons menuInit={menuInit} navigate={navigate} />
            </AssayHeader>
            <AssayOverrideBanner assay={assayDefinition} link={AssayLink.RESULTS} />
            <AssayGridPanel
                assayDefinition={assayDefinition}
                canDelete={assayProtocol.editableResults}
                canUpdate={assayProtocol.editableResults}
                setIsDirty={setIsDirty}
                getIsDirty={getIsDirty}
                queryName="Data"
                nounSingular="result"
                nounPlural="results"
            />
        </Page>
    );
};

export const AssayResultListingPage = withRouteLeave(assayPage(AssayResultListingPageImpl));
