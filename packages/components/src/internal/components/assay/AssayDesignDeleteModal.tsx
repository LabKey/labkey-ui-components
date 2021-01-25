import React, { FC, memo, useState, useEffect, useCallback } from 'react';

import {
    deleteAssayDesign,
    AssayDefinitionModel,
    LoadingModal,
    Progress,
    SchemaQuery,
    createDeleteErrorNotification,
    createDeleteSuccessNotification,
    isLoading,
    AssayDesignDeleteConfirmModal,
} from '../../..';

// These need to be direct imports from files to avoid circular dependencies in index.ts
import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';

const ASSAY_RUN_MODEL_ID = 'assay-runs-all';

interface Props {
    assay: AssayDefinitionModel;
    beforeDelete?: () => any;
    afterDelete: (success: boolean) => any;
    onCancel: () => any;
}

const noun = 'assay design';

const AssayDesignDeleteModalImpl: FC<Props & InjectedQueryModels> = memo(props => {
    const { queryModels, actions, assay, beforeDelete, afterDelete, onCancel } = props;

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
                createDeleteSuccessNotification(noun);
            })
            .catch(error => {
                afterDelete(false);
                createDeleteErrorNotification(noun);
            });
    }, [assay, beforeDelete, afterDelete]);

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
