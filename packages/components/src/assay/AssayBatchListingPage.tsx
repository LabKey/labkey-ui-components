import React, { FC, memo } from 'react';
import { InjectedAssayModel } from '../internal/components/assay/withAssayModels';
import { Page } from '../internal/components/base/Page';
import { AssayHeader } from './AssayHeader';
import { AssayDesignHeaderButtons, AssayImportDataButton } from './AssayButtons';
import { AssayOverrideBanner } from './AssayOverrideBanner';
import { GridPanelWithModel } from '../public/QueryModel/GridPanel';
import { AssayLink } from '../internal/AssayDefinitionModel';
import { SchemaQuery } from '../public/SchemaQuery';
import { assayPage } from './AssayPageHOC';
import { CommonPageProps } from '../internal/models';

const AssayBatchListingPageImpl: FC<CommonPageProps & InjectedAssayModel> = memo(props => {
    const {assayDefinition, menu, menuInit, navigate} = props;
    const subTitle = "Assay Batches";

    return (
        <Page title={`${assayDefinition.name} - ${subTitle}`}>
            <AssayHeader menu={menu} subTitle={subTitle} description={assayDefinition.description}>
                <AssayDesignHeaderButtons menuInit={menuInit} navigate={navigate} />
            </AssayHeader>
            <AssayOverrideBanner assay={assayDefinition} link={AssayLink.BATCHES}/>
            <GridPanelWithModel
                ButtonsComponent={AssayImportDataButton as any} // Does not implement RequiresModelsAndActions
                queryConfig={{
                    schemaQuery: SchemaQuery.create(assayDefinition.protocolSchemaName, 'Batches'),
                    urlPrefix: 'Batches', // Match LabKey Data Region
                }}
            />
        </Page>
    );
});

export const AssayBatchListingPage = assayPage(AssayBatchListingPageImpl);
