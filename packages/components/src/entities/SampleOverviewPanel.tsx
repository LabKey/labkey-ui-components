import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { QueryConfig, QueryModel } from '../public/QueryModel/QueryModel';
import { Actions } from '../public/QueryModel/withQueryModels';
import { User } from '../internal/components/base/models/User';
import { Container } from '../internal/components/base/models/Container';

import { getSampleStatusType, isSampleOperationPermitted } from '../internal/components/samples/utils';
import { ALIQUOT_FILTER_MODE, SampleOperation } from '../internal/components/samples/constants';
import { isELNEnabled } from '../internal/app/utils';
import { getContainerFilterForLookups } from '../internal/query/api';

import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

import { SampleAliquotsSummary } from './SampleAliquotsSummary';
import { SampleDetailEditing } from './SampleDetailEditing';

import { getSampleAuditBehaviorType } from './utils';
import { SampleStorageLocation } from './models';
import { useSampleTypeAppContext } from './SampleTypeAppContext';

interface Props {
    SampleStorageLocationComponent: SampleStorageLocation;
    actionChangeCount: number;
    actions: Actions;
    canUpdate: boolean;
    noun?: string;
    onDetailUpdate: (skipChangeCount?: boolean) => void;
    sampleContainer: Container;
    sampleModel: QueryModel;
    user: User;
}

export const SampleOverviewPanel: FC<Props> = memo(props => {
    const {
        canUpdate,
        sampleContainer,
        onDetailUpdate,
        sampleModel,
        actionChangeCount,
        actions,
        user,
        noun,
        SampleStorageLocationComponent,
    } = props;
    const { getWorkflowGridQueryConfigs, ReferencingNotebooksComponent, detailRenderer } = useSampleTypeAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const row = useMemo(() => {
        return !sampleModel.isLoading ? sampleModel.getRow() : undefined;
    }, [sampleModel]);

    const auditBehavior = getSampleAuditBehaviorType();
    const sampleStatusType = getSampleStatusType(row);
    const _canUpdate = !isEditing && canUpdate;
    const aliquotedFrom = sampleModel.getRowValue('AliquotedFromLSID/Name');
    const sampleId = sampleModel.getRowValue('RowId');
    const sampleLsid = sampleModel.getRowValue('LSID');
    const sampleName = sampleModel.getRowValue('Name');
    const sampleType = sampleModel.schemaQuery.queryName;
    const isAliquot = aliquotedFrom != null;
    const { isMedia } = sampleModel.queryInfo;
    const jobConfigs = getWorkflowGridQueryConfigs(
        ['all'], // i.e. ALL_JOBS_QUEUE_KEY
        'sample-aliquot-jobs',
        null,
        null,
        null,
        sampleLsid,
        null,
        ALIQUOT_FILTER_MODE.aliquots
    );
    const onUpdate = useCallback(() => onDetailUpdate(true), [onDetailUpdate]);

    if (!sampleModel || sampleModel.isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <>
            {!isMedia && (
                <div className="row">
                    {SampleStorageLocationComponent && (
                        <div className="col-xs-12 col-md-4">
                            <SampleStorageLocationComponent
                                updateAllowed={isSampleOperationPermitted(
                                    sampleStatusType,
                                    SampleOperation.UpdateStorageMetadata
                                )}
                                user={user}
                                sampleId={sampleId}
                                onUpdate={onUpdate} // SampleStorageLocation consumes but does not trigger actionChangeCount
                                actionChangeCount={actionChangeCount}
                            />
                        </div>
                    )}
                    {!isAliquot && (
                        <div className="col-xs-12 col-md-4">
                            <SampleAliquotsSummary
                                sampleId={sampleId}
                                sampleSet={sampleType}
                                sampleLsid={sampleLsid}
                                sampleRow={row}
                                sampleSchemaQuery={sampleModel.queryInfo.schemaQuery}
                                aliquotJobsQueryConfig={Object.values(jobConfigs)[0] as QueryConfig}
                            />
                        </div>
                    )}
                    {isELNEnabled() && ReferencingNotebooksComponent && (
                        <div className="col-xs-12 col-md-4">
                            <ReferencingNotebooksComponent
                                label={sampleName}
                                queryName={sampleModel.queryName}
                                schemaName={sampleModel.schemaName}
                                value={sampleModel.keyValue}
                            />
                        </div>
                    )}
                </div>
            )}
            <div className="row">
                <div className={`col-md-${isMedia ? '7' : '12'}`}>
                    <SampleDetailEditing
                        actions={actions}
                        auditBehavior={auditBehavior}
                        canUpdate={_canUpdate}
                        containerFilter={getContainerFilterForLookups()}
                        containerPath={sampleContainer.path}
                        detailRenderer={detailRenderer}
                        onEditToggle={setIsEditing}
                        onUpdate={onDetailUpdate}
                        model={sampleModel}
                        noun={noun}
                        sampleSet={sampleType}
                    />
                </div>
                {isMedia && ReferencingNotebooksComponent && (
                    <div className="col-md-5">
                        <ReferencingNotebooksComponent
                            label={sampleName}
                            queryName={sampleModel.queryName}
                            schemaName={sampleModel.schemaName}
                            value={sampleModel.keyValue}
                        />
                    </div>
                )}
            </div>
        </>
    );
});
