import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { WithRouterProps } from 'react-router';
import { List, Map, OrderedMap } from 'immutable';
import { Filter } from '@labkey/api';

import {
    ALIQUOT_CREATION,
    CHILD_SAMPLE_CREATION,
    DERIVATIVE_CREATION,
    POOLED_SAMPLE_CREATION,
    SampleCreationType,
    SampleCreationTypeModel,
} from '../internal/components/samples/models';
import { InjectedRouteLeaveProps, useRouteLeave } from '../internal/util/RouteLeave';
import { useServerContext } from '../internal/components/base/ServerContext';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';
import { AppURL } from '../internal/url/AppURL';
import { SAMPLES_KEY } from '../internal/app/constants';
import { hasModule } from '../internal/app/utils';
import { getContainerFilterForLookups, invalidateQueryDetailsCacheKey } from '../internal/query/api';
import { SchemaQuery } from '../public/SchemaQuery';
import { SCHEMAS } from '../internal/schemas';
import { DataClassDataType, SampleTypeDataType } from '../internal/components/entities/constants';
import { QueryInfo } from '../public/QueryInfo';
import { EntityParentType } from '../internal/components/entities/models';
import { BulkAddData } from '../internal/components/editable/EditableGrid';
import { parseCsvString } from '../internal/util/utils';
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
import { getSampleAuditBehaviorType, getSampleTypeTemplateUrl } from './utils';
import { SAMPLES_LISTING_GRID_ID } from './SampleListingPage';
import { useSampleTypeAppContext } from './SampleTypeAppContext';

const TITLE = 'Sample Type';
const SUBTITLE = 'Create New Samples';

const getCreationTypes = (hasParentSamples: boolean, urlCreationType: string): SampleCreationTypeModel[] => {
    if (!hasParentSamples) return [{ ...CHILD_SAMPLE_CREATION, selected: true }];

    const types = [
        {
            ...DERIVATIVE_CREATION,
            selected: !urlCreationType || urlCreationType === DERIVATIVE_CREATION.type,
        },
        { ...POOLED_SAMPLE_CREATION, selected: urlCreationType === POOLED_SAMPLE_CREATION.type },
        { ...ALIQUOT_CREATION, selected: urlCreationType === ALIQUOT_CREATION.type },
    ];

    const selectedType = types.find(type => type.selected);
    if (!selectedType) {
        types[0] = { ...types[0], selected: true };
    }

    return types;
};

interface OwnProps {
    // loadNameExpressionOptions is a prop for testing purposes only
    loadNameExpressionOptions?: () => Promise<{ allowUserSpecifiedNames: boolean; prefix: string }>;
}

export interface SampleCreatePageProps extends OwnProps, CommonPageProps, WithRouterProps, InjectedRouteLeaveProps {}

export const SampleCreatePage: FC<SampleCreatePageProps> = memo(props => {
    const { loadNameExpressionOptions, location, navigate, router, routes, goBack } = props;
    const { creationType, selectionKey, useAsync } = location?.query;
    const [sampleCreationTypes, setSampleCreationTypes] = useState<SampleCreationTypeModel[]>(
        selectionKey ? getCreationTypes(selectionKey.indexOf(SAMPLES_LISTING_GRID_ID) === 0, creationType) : []
    );
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
                invalidateQueryDetailsCacheKey(
                    SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, targetSampleTypeName).getKey()
                );
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

    const getFileTemplateUrl = useCallback((queryInfo: QueryInfo, importAliases: Record<string, string>): string => {
        return getSampleTypeTemplateUrl(queryInfo, importAliases, downloadTemplateExcludeColumns);
    }, []);

    const onParentChange = useCallback(
        (parentTypes: Map<string, List<EntityParentType>>): void => {
            const numSampleParents = parentTypes.get(SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName)?.size;
            setSampleCreationTypes(getCreationTypes(numSampleParents > 0, creationType));
        },
        [creationType]
    );

    const onBulkAdd = useCallback(
        (data: OrderedMap<string, any>): BulkAddData => {
            const numItems = data.get('numItems');
            let totalItems = 0;
            const creationType_ = data.get('creationType');
            const poolingSampleParents = creationType_ && creationType_ === SampleCreationType.PooledSamples;

            let validationMsg;
            let pivotKey;
            let pivotValues = [];
            let haveMultiParent = false;
            if (sampleCreationTypes?.length > 0) {
                data.keySeq().forEach(key => {
                    const isSampleParent = key.indexOf(SampleTypeDataType.insertColumnNamePrefix) === 0;
                    const isDataClassParent = key.indexOf(DataClassDataType.insertColumnNamePrefix) === 0;
                    if (isSampleParent || isDataClassParent) {
                        if (data.get(key)) {
                            const parents = data.get(key);
                            if (parents.length > 0) {
                                const values =
                                    typeof parents[0] === 'string' ? parseCsvString(parents[0], ',') : parents;
                                if (values.length > 1) {
                                    if (haveMultiParent) {
                                        validationMsg = combineParentTypes
                                            ? 'Only one parent type with more than one value is allowed when creating non-pooled samples in bulk.'
                                            : 'Only one source or parent with more than one value is allowed when creating non-pooled samples in bulk.';
                                    } else if ((isSampleParent && !poolingSampleParents) || isDataClassParent) {
                                        pivotValues = values;
                                        pivotKey = key;
                                        haveMultiParent = true;
                                        totalItems = numItems * values.length;
                                    }
                                }
                            }
                        }
                    }
                });
            }

            if (validationMsg) return { validationMsg };
            if (totalItems === 0) totalItems = numItems;
            return { pivotKey, pivotValues, totalItems };
        },
        [sampleCreationTypes?.length]
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
                creationTypeOptions={sampleCreationTypes}
                combineParentTypes={combineParentTypes}
                containerFilter={getContainerFilterForLookups()}
                entityDataType={entityDataType}
                fileImportParameters={fileImportParameters}
                fileSizeLimits={DATA_IMPORT_FILE_SIZE_LIMITS}
                getFileTemplateUrl={getFileTemplateUrl}
                getIsDirty={getIsDirty}
                importHelpLinkNode={<HelpLink topic={importHelpLinkTopic}>Import Sample Types</HelpLink>}
                loadNameExpressionOptions={loadNameExpressionOptions}
                location={location}
                maxEntities={MAX_EDITABLE_GRID_ROWS}
                nounPlural="samples"
                nounSingular="sample"
                onBackgroundJobStart={onBackgroundJobStart}
                onBulkAdd={onBulkAdd}
                onCancel={goBack}
                onParentChange={onParentChange}
                parentDataTypes={parentDataTypes}
                setIsDirty={setIsDirty}
            />
        </SampleTypeBasePage>
    );
});
