import React, { FC, memo, useCallback, useMemo } from 'react';
import { WithRouterProps } from 'react-router';
import { OrderedMap } from 'immutable';
import { Filter } from '@labkey/api';

import { InjectedRouteLeaveProps, useRouteLeave } from '../internal/util/RouteLeave';
import { useServerContext } from '../internal/components/base/ServerContext';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';
import { AppURL } from '../internal/url/AppURL';
import { SAMPLES_KEY } from '../internal/app/constants';
import { hasModule } from '../internal/app/utils';
import { getContainerFilterForLookups, invalidateQueryDetailsCache } from '../internal/query/api';
import { SchemaQuery } from '../public/SchemaQuery';
import { SCHEMAS } from '../internal/schemas';
import { SampleTypeDataType } from '../internal/components/entities/constants';
import { QueryInfo } from '../public/QueryInfo';
import { BulkAddData } from '../internal/components/editable/EditableGrid';
import { InsufficientPermissionsPage } from '../internal/components/permissions/InsufficientPermissionsPage';
import { EntityInsertPanel } from '../internal/components/entities/EntityInsertPanel';
import { SAMPLE_INSERT_EXTRA_COLUMNS } from '../internal/components/samples/constants';
import {
    BACKGROUND_IMPORT_MIN_FILE_SIZE,
    DATA_IMPORT_FILE_SIZE_LIMITS,
} from '../internal/components/pipeline/constants';
import { HelpLink } from '../internal/util/helpLinks';
import { CommonPageProps } from '../internal/models';
import { MAX_EDITABLE_GRID_ROWS } from '../internal/constants';

import { SampleTypeBasePage } from './SampleTypeBasePage';
import { onSampleChange } from './actions';
import { getSampleAuditBehaviorType, getSampleTypeTemplateUrl, processSampleBulkAdd } from './utils';
import { useSampleTypeAppContext } from './useSampleTypeAppContext';

const TITLE = 'Sample Type';
const SUBTITLE = 'Create New Samples';

export interface SampleCreatePageProps extends CommonPageProps, WithRouterProps, InjectedRouteLeaveProps {}

export const SampleCreatePage: FC<SampleCreatePageProps> = memo(props => {
    const { location, navigate, router, routes, goBack } = props;
    const { useAsync } = location?.query;
    const { user } = useServerContext();
    const { createNotification } = useNotificationsContext();
    const { combineParentTypes, controllerName, downloadTemplateExcludeColumns, importHelpLinkTopic, parentDataTypes } =
        useSampleTypeAppContext();
    const [getIsDirty, setIsDirty] = useRouteLeave(router, routes);
    const auditBehavior = getSampleAuditBehaviorType();
    const fileImportParameters = useMemo(
        () => ({
            auditBehavior,
            pipelineProvider: 'Samples Import',
            pipelineNotificationProvider: controllerName,
        }),
        [auditBehavior, controllerName]
    );

    const entityDataType = useMemo(() => {
        return {
            ...SampleTypeDataType,
            // media create/import has its own page in LKB, so filter them out here
            filterArray: [Filter.create('Category', 'media', Filter.Types.NEQ_OR_NULL)],
        };
    }, []);

    const afterEntityCreation = useCallback(
        (
            targetSampleTypeName: string,
            filter: Filter.IFilter,
            sampleCount: number,
            actionStr: string,
            transactionAuditId: number
        ): void => {
            if (hasModule('study')) {
                // After creating samples, if the sample type has an auto-link to a study, a column is added to the default view for that link,
                // so we need to reload the queryInfo for the sample type.
                // N.B.  We could call getDomainDetails for the sample type and see if there is an options.autoLinkTargetContainerId and
                // clear the cache only then, but the minor optimization doesn't seem worth it.
                invalidateQueryDetailsCache(SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, targetSampleTypeName));
            }
            onSampleChange();

            const sampleTypeURL = AppURL.create(SAMPLES_KEY, targetSampleTypeName)
                .addParam('transactionAuditId', transactionAuditId)
                .addParam(actionStr === 'created' ? 'createdSampleCount' : 'importedSampleCount', sampleCount);
            navigate(sampleTypeURL);
        },
        [navigate]
    );

    const onBackgroundJobStart = useCallback(
        (targetSampleTypeName: string, filename: string, jobId: number) => {
            const sampleTypeURL = AppURL.create(SAMPLES_KEY, targetSampleTypeName).addParam('importInProgress', true);

            onSampleChange();

            createNotification(
                {
                    message: (
                        <>
                            Importing {filename}. You'll be notified when it's done. Click{' '}
                            <a href={AppURL.create('pipeline', jobId).toHref()}>here</a> to check the status of the
                            background import.
                        </>
                    ),
                },
                true,
                () => navigate(sampleTypeURL)
            );
        },
        [createNotification, navigate]
    );

    const getFileTemplateUrl = useCallback(
        (queryInfo: QueryInfo, importAliases: Record<string, string>): string => {
            return getSampleTypeTemplateUrl(queryInfo, importAliases, downloadTemplateExcludeColumns);
        },
        [downloadTemplateExcludeColumns]
    );

    const onBulkAdd = useCallback(
        (data: OrderedMap<string, any>): BulkAddData => {
            return processSampleBulkAdd(data, combineParentTypes);
        },
        [combineParentTypes]
    );

    if (!user.hasInsertPermission()) {
        return <InsufficientPermissionsPage title={SUBTITLE} />;
    }

    // BUG: <EntityInsertPanel /> does not properly recognize changes in the entityDataType prop.
    // Thus, if the initial load does not contain any filters on the entityDataType it will make a query
    // and not subsequently re-query if the filter(s) change. Here this is blocked by not rendering
    // the EntityInsertPanel until sample type information is available.
    return (
        <SampleTypeBasePage subtitle={SUBTITLE} title={TITLE}>
            <EntityInsertPanel
                afterEntityCreation={afterEntityCreation}
                allowedNonDomainFields={SAMPLE_INSERT_EXTRA_COLUMNS}
                asyncSize={useAsync === 'true' ? 1 : BACKGROUND_IMPORT_MIN_FILE_SIZE}
                auditBehavior={auditBehavior}
                canEditEntityTypeDetails={user.hasDesignSampleTypesPermission()}
                combineParentTypes={combineParentTypes}
                containerFilter={getContainerFilterForLookups()}
                entityDataType={entityDataType}
                fileImportParameters={fileImportParameters}
                fileSizeLimits={DATA_IMPORT_FILE_SIZE_LIMITS}
                getFileTemplateUrl={getFileTemplateUrl}
                getIsDirty={getIsDirty}
                importHelpLinkNode={<HelpLink topic={importHelpLinkTopic}>Import Sample Types</HelpLink>}
                location={location}
                maxEntities={MAX_EDITABLE_GRID_ROWS}
                navigate={navigate}
                nounPlural="samples"
                nounSingular="sample"
                onBackgroundJobStart={onBackgroundJobStart}
                onBulkAdd={onBulkAdd}
                onCancel={goBack}
                parentDataTypes={parentDataTypes}
                setIsDirty={setIsDirty}
            />
        </SampleTypeBasePage>
    );
});
