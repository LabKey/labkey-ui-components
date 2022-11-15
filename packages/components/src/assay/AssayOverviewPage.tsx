/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC } from 'react';
import { Filter } from '@labkey/api';

import { InjectedAssayModel } from '../internal/components/assay/withAssayModels';

import { InjectedQueryModels, QueryConfigMap, withQueryModels } from '../public/QueryModel/withQueryModels';

import {
    Alert,
    AssayLink,
    DetailPanel,
    GENERAL_ASSAY_PROVIDER_NAME,
    Hooks,
    InjectedRouteLeaveProps,
    LoadingPage,
    Page,
    QueryColumn,
    QueryModel,
    SCHEMAS,
    withRouteLeave,
} from '../index';

import { CommonPageProps } from '../internal/models';

import { useAssayAppContext } from './AssayAppContext';

import { AssayHeader } from './AssayHeader';
import { AssayDesignHeaderButtons } from './AssayButtons';
import { assayPage } from './AssayPageHOC';
import { AssayOverrideBanner } from './AssayOverrideBanner';
import { AssayGridPanel } from './AssayGridPanel';

const REQUIRED_COLUMN_NAMES = ['Description', 'Created', 'CreatedBy', 'Status'];

type AssayOverviewProps = CommonPageProps & InjectedAssayModel & InjectedQueryModels & InjectedRouteLeaveProps;

const AssayOverviewPageBody: FC<AssayOverviewProps> = props => {
    const { assayDefinition, assayProtocol, actions, navigate, menu, menuInit, queryModels, setIsDirty, getIsDirty } =
        props;
    const { model } = queryModels;
    const { name, type, description } = assayDefinition;
    const protocolContext = Hooks.useContainerUser(assayProtocol.domains.first()?.container);
    const { showProviderName, detailRenderer } = useAssayAppContext();
    const subtitle = showProviderName
        ? (type === GENERAL_ASSAY_PROVIDER_NAME ? 'Standard' : type) + ' Assay Overview'
        : undefined;

    const getDetailsColumns = (model: QueryModel): QueryColumn[] => {
        return REQUIRED_COLUMN_NAMES.map(name => model.getColumn(name));
    };

    if (model.isLoading || !protocolContext.isLoaded) {
        return <LoadingPage title="Assay Overview" />;
    }

    return (
        <Page hasHeader title={`${name} - Assay Overview`}>
            <AssayHeader menu={menu} subTitle={subtitle} description={description}>
                <AssayDesignHeaderButtons menuInit={menuInit} navigate={navigate} />
            </AssayHeader>

            <Alert>{protocolContext.error}</Alert>

            <AssayOverrideBanner assay={assayDefinition} link={AssayLink.BEGIN} />

            <DetailPanel
                asPanel
                detailRenderer={detailRenderer}
                actions={actions}
                model={model}
                queryColumns={getDetailsColumns(model)}
            />

            <AssayGridPanel
                assayDefinition={assayDefinition}
                protocol={assayProtocol}
                canDelete={true}
                canUpdate={assayProtocol.editableRuns}
                queryName="Runs"
                header="Runs"
                nounPlural="Runs"
                setIsDirty={setIsDirty}
                getIsDirty={getIsDirty}
            />
        </Page>
    );
};

const AssayOverviewPageWithModels = withQueryModels<InjectedAssayModel>(AssayOverviewPageBody);

const AssayOverviewPageImpl: FC<InjectedAssayModel & InjectedRouteLeaveProps> = props => {
    const { assayDefinition } = props;

    const queryConfigs: QueryConfigMap = {
        model: {
            schemaQuery: SCHEMAS.ASSAY_TABLES.ASSAY_DETAILS_SQ,
            baseFilters: [Filter.create('Name', assayDefinition.name)],
            omittedColumns: ['Name', 'LSID'],
            requiredColumns: REQUIRED_COLUMN_NAMES,
        },
    };

    return <AssayOverviewPageWithModels autoLoad key={assayDefinition.name} queryConfigs={queryConfigs} {...props} />;
};

export const AssayOverviewPage = withRouteLeave(assayPage(AssayOverviewPageImpl));
