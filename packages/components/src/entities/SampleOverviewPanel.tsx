import React, { ComponentType, FC, memo, useCallback, useMemo, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { Filter } from '@labkey/api';

import { SchemaQuery } from '../public/SchemaQuery';
import { QueryConfig, QueryModel } from '../public/QueryModel/QueryModel';
import { Actions, QueryConfigMap } from '../public/QueryModel/withQueryModels';
import { User } from '../internal/components/base/models/User';
import { Container } from '../internal/components/base/models/Container';
import { LoadingPage } from '../internal/components/base/LoadingPage';

import { getSampleStatusType, isSampleOperationPermitted } from '../internal/components/samples/utils';
import { ALIQUOT_FILTER_MODE, SampleOperation } from '../internal/components/samples/constants';
import { isELNEnabled } from '../internal/app/utils';
import { getContainerFilterForLookups } from '../internal/query/api';

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
    onDetailUpdate: (skipChangeCount?: boolean) => void;
    sampleContainer: Container;
    sampleModel: QueryModel;
    sampleSet: string;
    title: string;
    user: User;
}

export const SampleOverviewPanel: FC<Props> = memo(props => {
    const {
        canUpdate,
        sampleContainer,
        title,
        onDetailUpdate,
        sampleModel,
        sampleSet,
        actionChangeCount,
        actions,
        user,
        SampleStorageLocationComponent,
    } = props;
    const { getWorkflowGridQueryConfigs, ReferencingNotebooksComponent } = useSampleTypeAppContext();
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
    const isAliquot = aliquotedFrom != null;
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
        return <LoadingPage title={title} />;
    }

    return (
        <>
            <Row>
                <Col xs={12} md={4}>
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
                </Col>

                {!isAliquot && (
                    <Col xs={12} md={4}>
                        <SampleAliquotsSummary
                            sampleId={sampleId}
                            sampleSet={sampleSet}
                            sampleLsid={sampleLsid}
                            sampleRow={row}
                            sampleSchemaQuery={sampleModel.queryInfo.schemaQuery}
                            aliquotJobsQueryConfig={Object.values(jobConfigs)[0] as QueryConfig}
                        />
                    </Col>
                )}

                {isELNEnabled() && (
                    <Col xs={12} md={4}>
                        <ReferencingNotebooksComponent
                            label={sampleName}
                            queryName={sampleModel.queryName}
                            schemaName={sampleModel.schemaName}
                            value={sampleModel.keyValue}
                        />
                    </Col>
                )}
            </Row>
            <SampleDetailEditing
                actions={actions}
                auditBehavior={auditBehavior}
                canUpdate={_canUpdate}
                model={sampleModel}
                onEditToggle={setIsEditing}
                onUpdate={onDetailUpdate}
                sampleSet={sampleSet}
                containerFilter={getContainerFilterForLookups()}
                containerPath={sampleContainer.path}
            />
        </>
    );
});
