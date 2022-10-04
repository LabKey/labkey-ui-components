import React, { FC, ReactNode } from 'react';

import { Page } from '../components/base/Page';
import { PageDetailHeader } from '../components/forms/PageDetailHeader';
import { getTitleDisplay } from '../components/pipeline/utils';
import { TemplateDownloadButton } from '../../public/files/TemplateDownloadButton';
import { Notifications } from '../components/notifications/Notifications';

interface OwnProps {
    description?: ReactNode;
    hasActiveJob?: boolean;
    onTemplateDownload?: () => void;
    buttons?: ReactNode;
    subtitle?: ReactNode;
    title: string;
}

type Props = OwnProps;

export const SampleTypeBasePage: FC<Props> = props => {
    const { children, title, buttons, subtitle, onTemplateDownload, description, hasActiveJob } = props;

    return (
        <Page title={title + (subtitle ? ' - ' + subtitle : '')} hasHeader={true}>
            <PageDetailHeader
                iconDir="_images"
                iconSrc="sample_set"
                title={getTitleDisplay(title, hasActiveJob)}
                subTitle={subtitle}
                description={description}
                leftColumns={9}
                iconAltText="sample_type-icon"
            >
                <TemplateDownloadButton
                    onClick={onTemplateDownload}
                    className={buttons ? 'button-right-spacing' : ''}
                />
                {buttons}
            </PageDetailHeader>
            <Notifications />
            {children}
        </Page>
    );
};
