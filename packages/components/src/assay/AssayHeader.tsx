import React, { FC, ReactNode } from 'react';
import { ProductMenuModel } from '../internal/components/navigation/model';
import { getTitleDisplay, hasActivePipelineJob } from '../internal/components/pipeline/utils';
import { PageDetailHeader } from '../internal/components/forms/PageDetailHeader';
import { TemplateDownloadButton } from '../public/files/TemplateDownloadButton';
import { ASSAYS_KEY } from '../internal/app/constants';
import { AssayDesignHeaderButtons, AssayHeaderButtonProps, AssayRunDetailHeaderButtons } from './AssayButtons';
import { Notifications } from '../internal/components/notifications/Notifications';


interface Props extends AssayHeaderButtonProps {
    title?: ReactNode;
    subTitle?: ReactNode;
    staticTitle?: ReactNode;
    description?: ReactNode;
    menu: ProductMenuModel;
}

export const AssayHeader: FC<Props> = props => {
    const { assayDefinition, assayProtocol, staticTitle, title, subTitle, description, menu, runId, ...buttonProps } = props;

    const isJobActive = assayDefinition ? hasActivePipelineJob(menu, ASSAYS_KEY, assayDefinition.name) : false;
    let titleDisplay = staticTitle ?? title;

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
                leftColumns={9}
            >
                <TemplateDownloadButton templateUrl={assayDefinition?.templateLink} className="button-right-spacing" />
                {runId != null && (
                    <AssayRunDetailHeaderButtons
                        assayDefinition={assayDefinition}
                        assayProtocol={assayProtocol}
                        runId={runId}
                        {...buttonProps}
                    />
                )}
                {runId == null && assayDefinition && (
                    <AssayDesignHeaderButtons
                        assayDefinition={assayDefinition}
                        assayProtocol={assayProtocol}
                        {...buttonProps}
                    />
                )}
            </PageDetailHeader>
            <Notifications />
        </>
    );
}
