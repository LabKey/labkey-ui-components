import React, { FC, memo, useMemo } from 'react';
import { InjectedAssayModel } from '../internal/components/assay/withAssayModels';
import { CommonPageProps } from '../internal/models';
import { InjectedRouteLeaveProps } from '../internal/util/RouteLeave';
import {
    NotificationsContextProps,
    useNotificationsContext
} from '../internal/components/notifications/NotificationsContext';
import { WithRouterProps } from 'react-router';
import { useServerContext } from '../internal/components/base/ServerContext';
import { Utils } from '@labkey/api';
import { AssayUploadResultModel } from '../internal/components/assay/models';
import { onAssayRunChange } from './actions';
import { getAssayImportNotificationMsg } from './utils';
import { AppURL } from '../internal/url/AppURL';
import { ASSAYS_KEY } from '../internal/app/constants';
import { InsufficientPermissionsPage } from '../internal/components/permissions/InsufficientPermissionsPage';
import { Page } from '../internal/components/base/Page';
import { AssayHeader } from './AssayHeader';
import { AssayImportPanels } from '../internal/components/assay/AssayImportPanels';
import { useAssayAppContext } from './AssayAppContext';
import { assayPage } from './AssayPageHOC';

type Props = CommonPageProps & InjectedAssayModel & InjectedRouteLeaveProps & WithRouterProps;

const AssayUploadPageImpl: FC<Props> = memo(props =>  {
    const {
        assayDefinition,
        assayProtocol,
        location,
        menu,
        getIsDirty,
        setIsDirty,
        goBack,
        navigate
    } = props;
    const { user } = useServerContext();
    const { jobNotificationProvider } = useAssayAppContext();
    const { createNotification } = useNotificationsContext();


    // only show the "Save and Import Another Run" option if this assay has batch props
    const batchDomain = useMemo(() => {
        return assayProtocol?.getDomainByNameSuffix('Batch');
    }, [assayProtocol]);

    const showSave = useMemo(() => {
        return batchDomain?.fields.size > 0;
    }, [batchDomain]);

    const runId = useMemo(() => {
        const id = location?.query?.runId;
        if (!id)
            return undefined;
        else if (Utils.isArray(id))  {
            return id[0];
        }

        return id.toString();
    }, [location]);

    const isReimport = useMemo(() => {
        return runId !== undefined;
    }, [runId]);

    const subTitle = useMemo(() => {
        return isReimport ? 'Assay Re-Import' : 'Assay Import';
    }, [isReimport]);


    const onSave = (response: AssayUploadResultModel, isBackgroundJob?: boolean) => {
        onAssayRunChange(assayDefinition.protocolSchemaName);

        createNotification({
            message: getAssayImportNotificationMsg(
                response,
                isBackgroundJob,
                isReimport,
                assayDefinition,
                location?.query?.workflowJobId,
                location?.query?.workflowTaskId
            ),
        }, true);
    };

    const onComplete = (response: AssayUploadResultModel, isBackgroundJob?: boolean) => {
        onAssayRunChange(assayDefinition.protocolSchemaName);

        let redirectUrl: AppURL;
        if (!isBackgroundJob) {
            redirectUrl = AppURL.create(
                ASSAYS_KEY,
                assayDefinition.type,
                assayDefinition.name,
                'runs',
                response.runId
            );
        } else {
            redirectUrl = AppURL.create(ASSAYS_KEY, assayDefinition.type, assayDefinition.name);
        }
        navigate(redirectUrl);

        createNotification({
            message: getAssayImportNotificationMsg(
                response,
                isBackgroundJob,
                isReimport,
                null,
                location?.query?.workflowJobId,
                location?.query?.workflowTaskId
            ),
        }, true);
    };

    const onCancel = () => {
        setIsDirty(false);
        goBack();
    };

    if (!user.hasInsertPermission()) {
        return <InsufficientPermissionsPage title={subTitle} />;
    }

    // Intentionally not showing buttons in header, for consistency with other upload pages
    return (
        <Page title={assayDefinition.name + ' - ' + subTitle} hasHeader>
            <AssayHeader menu={menu} subTitle={subTitle} description={assayDefinition.description} includeTemplateButton={false} />
            <AssayImportPanels
                assayDefinition={assayDefinition}
                runId={runId}
                onCancel={onCancel}
                onSave={showSave ? onSave : undefined}
                onComplete={onComplete}
                location={location}
                allowBulkRemove={true}
                allowBulkInsert={true}
                allowBulkUpdate={true}
                jobNotificationProvider={jobNotificationProvider}
                assayProtocol={assayProtocol}
                setIsDirty={setIsDirty}
                getIsDirty={getIsDirty}
            />
        </Page>
    );
});

export const AssayUploadPage = assayPage(AssayUploadPageImpl);
