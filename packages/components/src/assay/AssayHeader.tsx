import React, { FC, ReactNode, useContext } from 'react';

import { ProductMenuModel } from '../internal/components/navigation/model';
import { getTitleDisplay, hasActivePipelineJob } from '../internal/components/pipeline/utils';
import { PageDetailHeader } from '../internal/components/forms/PageDetailHeader';
import { TemplateDownloadButton } from '../public/files/TemplateDownloadButton';
import { ASSAYS_KEY } from '../internal/app/constants';
import { Notifications } from '../internal/components/notifications/Notifications';
import { AssayContext } from '../internal/components/assay/withAssayModels';

interface Props {
    description?: ReactNode;
    includeTemplateButton?: boolean;
    leftColumns?: number;
    menu: ProductMenuModel;
    subTitle?: ReactNode;
    title?: ReactNode;
}

export const AssayHeader: FC<Props> = props => {
    const { children, title, subTitle, description, menu, leftColumns = 9, includeTemplateButton = true } = props;
    const { assayDefinition } = useContext(AssayContext);

    const isJobActive = assayDefinition ? hasActivePipelineJob(menu, ASSAYS_KEY, assayDefinition.name) : false;
    let titleDisplay = title;

    if (!title && assayDefinition) {
        titleDisplay = getTitleDisplay(assayDefinition.name, isJobActive);
    }

    let descriptionDisplay = description;
    if (assayDefinition && description === assayDefinition.name) {
        descriptionDisplay = getTitleDisplay(assayDefinition.name, isJobActive);
    }

    return (
        <>
            <PageDetailHeader
                iconSrc="assay"
                title={titleDisplay}
                subTitle={subTitle}
                description={descriptionDisplay}
                leftColumns={leftColumns} // On run details pages allow for more room for the name of the run
            >
                {includeTemplateButton && (
                    <TemplateDownloadButton
                        templateUrl={assayDefinition?.templateLink}
                        className="button-right-spacing"
                    />
                )}
                {children}
            </PageDetailHeader>
            <Notifications />
        </>
    );
};
