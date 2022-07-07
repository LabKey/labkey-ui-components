import React, { FC, memo, useState, useEffect, useCallback } from 'react';

import {
    deleteAssayDesign,
    AssayDefinitionModel,
    LoadingModal,
    Progress,
    SchemaQuery,
    isLoading,
    AssayDesignDeleteConfirmModal,
    useNotificationsContext,
} from '../../..';

// These need to be direct imports from files to avoid circular dependencies in index.ts
import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';
import { getDeleteErrorNotification, getDeleteSuccessNotification } from '../notifications/messaging';

const ASSAY_RUN_MODEL_ID = 'assay-runs-all';

interface Props {
    afterDelete: (success: boolean) => any;
    assay: AssayDefinitionModel;
    beforeDelete?: () => any;
    onCancel: () => any;
}

const noun = 'assay design';

const AssayDesignDeleteModalImpl: FC<Props & InjectedQueryModels> = memo(props => {
    const { queryModels, actions, assay, beforeDelete, afterDelete, onCancel } = props;
    const { createNotification } = useNotificationsContext();
    const [showProgress, setShowProgress] = useState(false);

    useEffect(() => {
        actions.addModel(
            {
                id: ASSAY_RUN_MODEL_ID,
                schemaQuery: SchemaQuery.create(assay.protocolSchemaName, 'Runs'),
            },
            true
        );
    }, [actions, assay]);

    const onConfirm = useCallback(() => {
        setShowProgress(true);
        if (beforeDelete) beforeDelete();

        deleteAssayDesign(assay.id.toString())
            .then(() => {
                afterDelete(true);
                createNotification(getDeleteSuccessNotification(noun));
            })
            .catch(error => {
                console.error(error);
                afterDelete(false);
                createNotification({
                    alertClass: 'danger',
                    message: () => getDeleteErrorNotification(noun),
                });
            });
    }, [beforeDelete, assay.id, afterDelete, createNotification]);

    const model = queryModels[ASSAY_RUN_MODEL_ID];

    return (
        <div>
            {!model || isLoading(model.rowsLoadingState) ? (
                <LoadingModal title={`Deleting ${noun}`} onCancel={onCancel} />
            ) : (
                <>
                    {!showProgress && (
                        <AssayDesignDeleteConfirmModal
                            assayDesignName={assay.name}
                            numRuns={model.rowCount}
                            onConfirm={onConfirm}
                            onCancel={onCancel}
                        />
                    )}
                    <Progress
                        modal={true}
                        delay={0}
                        estimate={model.rowCount * 10}
                        title={`Deleting ${noun}`}
                        toggle={showProgress}
                    />
                </>
            )}
        </div>
    );
});

export const AssayDesignDeleteModal = withQueryModels<Props>(AssayDesignDeleteModalImpl);
