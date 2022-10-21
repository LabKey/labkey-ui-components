import React, { FC, memo, useState, useEffect, useCallback } from 'react';

import { Ajax, Utils } from '@labkey/api';

import { deleteErrorMessage, deleteSuccessMessage } from '../internal/util/messaging';
import { AssayDefinitionModel } from '../internal/AssayDefinitionModel';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';
import { SchemaQuery } from '../public/SchemaQuery';

import { isLoading } from '../public/LoadingState';
import { LoadingModal } from '../internal/components/base/LoadingModal';

import { Progress } from '../internal/components/base/Progress';

import { InjectedQueryModels, withQueryModels } from '../public/QueryModel/withQueryModels';

import { buildURL } from '../internal/url/AppURL';

import { AssayDesignDeleteConfirmModal } from './AssayDesignDeleteConfirmModal';

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
                createNotification(deleteSuccessMessage(noun));
            })
            .catch(error => {
                console.error(error);
                afterDelete(false);
                createNotification({
                    alertClass: 'danger',
                    message: () => deleteErrorMessage(noun),
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

function deleteAssayDesign(rowId: string): Promise<any> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('experiment', 'deleteProtocolByRowIdsAPI.api'),
            method: 'POST',
            params: {
                singleObjectRowId: rowId,
                forceDelete: true,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}
