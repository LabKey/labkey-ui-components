import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { AuditBehaviorTypes } from '@labkey/api';

import { Progress } from '../base/Progress';
import { Modal } from '../../Modal';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { Container } from '../base/models/Container';
import { useNotificationsContext } from '../notifications/NotificationsContext';
import { capitalizeFirstChar } from '../../util/utils';
import { HelpLink, MOVE_SAMPLES_TOPIC } from '../../util/helpLinks';
import { isLoading, LoadingState } from '../../../public/LoadingState';
import { AppURL } from '../../url/AppURL';
import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';
import { getPermissionRestrictionMessage } from '../../util/messaging';
import { EntityDataType, OperationConfirmationData } from './models';
import { getEntityNoun } from './utils';
import { EntityMoveConfirmationModal } from './EntityMoveConfirmationModal';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { AppLink } from '../../url/AppLink';

export interface EntityMoveModalProps {
    api?: ComponentsAPIWrapper;
    currentContainer?: Container; // used in the single move case when the item is not in the current container
    dataTypeRowId?: number;
    entityDataType: EntityDataType;
    maxSelected: number;
    onAfterMove: () => void;
    onCancel: () => void;
    rowIds: string[];
    schemaQuery: SchemaQuery;
    targetAppURL: AppURL;
}

export const EntityMoveModal: FC<EntityMoveModalProps> = memo(props => {
    const {
        api = getDefaultAPIWrapper(),
        currentContainer,
        dataTypeRowId,
        entityDataType,
        maxSelected,
        onAfterMove,
        onCancel,
        rowIds,
        schemaQuery,
        targetAppURL,
    } = props;
    const { nounPlural } = entityDataType;
    const { createNotification } = useNotificationsContext();
    const [confirmationData, setConfirmationData] = useState<OperationConfirmationData>();
    const [loading, setLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [error, setError] = useState<string>();
    const [showProgress, setShowProgress] = useState<boolean>(false);
    const [numConfirmed, setNumConfirmed] = useState<number>(0);
    const numSelected = rowIds.length;

    useEffect(
        () => {
            (async () => {
                setLoading(LoadingState.LOADING);

                try {
                    const confirmationData_ = await api.entity.getMoveConfirmationData(entityDataType, rowIds);
                    setConfirmationData(confirmationData_);
                } catch (e) {
                    setError('There was a problem retrieving the move confirmation data.');
                } finally {
                    setLoading(LoadingState.LOADED);
                }
            })();
        },
        [] //eslint-disable-line react-hooks/exhaustive-deps
    );

    const onConfirm = useCallback(
        async (targetContainerPath: string, targetName: string, auditUserComment: string) => {
            const count = confirmationData.totalActionable;
            const noun = getEntityNoun(entityDataType, count)?.toLowerCase();
            setNumConfirmed(count);
            setShowProgress(true);

            try {
                const moveResponse = await api.entity.moveEntities({
                    containerPath: currentContainer?.path,
                    targetContainerPath,
                    entityDataType,
                    schemaName: schemaQuery.schemaName,
                    queryName: schemaQuery.queryName,
                    rowIds: confirmationData.getActionableIds(),
                    auditBehavior: AuditBehaviorTypes.DETAILED,
                    auditUserComment,
                });
                const updatedUrl = targetAppURL.setContainerPath(targetContainerPath);
                const movedCount =
                    moveResponse.updateCounts[(entityDataType.moveNoun ?? entityDataType.nounPlural).toLowerCase()];
                const movedNoun = getEntityNoun(entityDataType, movedCount)?.toLowerCase();
                if (movedCount) {
                    const message = `Successfully moved ${movedCount} ${movedNoun} to`;
                    createNotification(
                        {
                            message: (
                                <>
                                    {message} <AppLink to={updatedUrl}>{targetName}</AppLink>.
                                </>
                            ),
                            alertClass: 'success',
                        },
                        true
                    );
                } else {
                    createNotification(
                        {
                            message: (
                                <>
                                    All {(entityDataType.nounPlural ?? 'data').toLowerCase()} are already in the target
                                    folder.
                                </>
                            ),
                            alertClass: 'warning',
                        },
                        true
                    );
                }
                onAfterMove();
            } catch (message) {
                setShowProgress(false);
                createNotification(
                    { alertClass: 'danger', message: 'There was a problem moving the ' + noun + '. ' + message },
                    true
                );
            } finally {
                onCancel();
            }
        },
        [
            confirmationData,
            entityDataType,
            api.entity,
            currentContainer?.path,
            schemaQuery,
            targetAppURL,
            onAfterMove,
            createNotification,
            onCancel,
        ]
    );

    if (maxSelected && numSelected > maxSelected) {
        return (
            <Modal cancelText="Dismiss" onCancel={onCancel} title={'Cannot Move ' + capitalizeFirstChar(nounPlural)}>
                You cannot move more than {maxSelected} individual {nounPlural.toLowerCase()} at a time. Please select
                fewer {nounPlural.toLowerCase()} and try again.
            </Modal>
        );
    }

    if (isLoading(loading)) {
        return (
            <Modal onCancel={onCancel} title="Move to Folder">
                <LoadingSpinner msg="Loading confirmation data..." />
            </Modal>
        );
    }

    if (error) {
        return (
            <Modal cancelText="Dismiss" onCancel={onCancel} title="Move to Folder">
                <Alert>{error}</Alert>
            </Modal>
        );
    }

    const { canMove, message, title } = getMoveConfirmationProperties(
        confirmationData,
        entityDataType.nounSingular,
        entityDataType.nounPlural
    );

    if (!canMove) {
        return (
            <Modal cancelText="Dismiss" onCancel={onCancel} title={'Cannot Move ' + capitalizeFirstChar(nounPlural)}>
                {message}
            </Modal>
        );
    }

    return (
        <>
            {!showProgress && (
                <EntityMoveConfirmationModal
                    confirmText="Move"
                    currentContainer={currentContainer}
                    dataType={entityDataType.folderConfigurableDataType}
                    dataTypeRowId={dataTypeRowId}
                    excludeCurrentAsTarget={maxSelected === 1}
                    nounPlural={nounPlural}
                    onCancel={onCancel}
                    onConfirm={onConfirm}
                    title={title}
                >
                    {message}
                </EntityMoveConfirmationModal>
            )}
            <Progress
                estimate={numConfirmed * 10}
                modal={true}
                title={`Moving ${numConfirmed} ${getEntityNoun(entityDataType, numConfirmed)}`}
                toggle={showProgress}
            />
        </>
    );
});
EntityMoveModal.displayName = 'EntityMoveModal';

const dependencyText = 'status that prevents moving';
const dependencyPermissionText = `${dependencyText} or you lack the proper permissions.`;

// exported for jest testing
export const getMoveConfirmationProperties = (
    confirmationData: OperationConfirmationData,
    nounSingular: string,
    nounPlural: string
): { canMove: boolean; message: any; title: string } => {
    if (!confirmationData) return undefined;

    const capNounSingular = capitalizeFirstChar(nounSingular);
    const capNounPlural = capitalizeFirstChar(nounPlural);
    const numCanMove = confirmationData.totalActionable;
    const numCannotMove = confirmationData.totalNotActionable;
    const numNotAllowed = confirmationData.notAllowed.length;
    const numNotPermitted = confirmationData.notPermitted.length;
    const canMoveNoun = numCanMove === 1 ? capNounSingular : capNounPlural;
    const totalNum = confirmationData.totalCount;
    const noun = totalNum === 1 ? nounSingular : nounPlural;

    let text: string;
    if (totalNum === 0) {
        text = `Either no ${nounPlural} are selected for moving, or the selected ${nounPlural} are no longer valid.`;
    } else if (numCannotMove === 0) {
        if (totalNum === 1) text = 'The selected';
        else if (totalNum == 2) text = 'Both';
        else text = `All ${totalNum}`;
        text = `${text} ${noun} will be moved.`;
    } else if (numCanMove === 0 && numNotPermitted < numCannotMove) {
        if (totalNum === 1) {
            text = `The ${noun} you've selected cannot be moved because it has a `;
        } else {
            const countText = numCannotMove === 2 ? 'Neither of' : 'None of';
            text = `${countText} the ${totalNum} ${noun} you've selected can be moved because they have a `;
        }
        text += dependencyPermissionText;
    } else if (numCanMove > 0) {
        text = `You've selected ${totalNum} ${noun} but only ${numCanMove} can be moved.`;
        if (numNotAllowed > 0) {
            const cannotMoveNoun = numNotAllowed === 1 ? nounSingular : nounPlural;
            const pronoun = numNotAllowed === 1 ? ' it has ' : ' they have ';
            text += ` ${numNotAllowed} ${cannotMoveNoun} cannot be moved because ${pronoun} ${dependencyText}.`;
        }
    }

    let message;
    if (numCannotMove > 0) {
        const permMsg = getPermissionRestrictionMessage(totalNum, numNotPermitted, nounSingular, nounPlural, 'move');
        message = (
            <>
                {text} {permMsg} <HelpLink topic={MOVE_SAMPLES_TOPIC}>more info</HelpLink>
            </>
        );
    }
    if (numCanMove > 0 && numCannotMove > 0) {
        message = <Alert bsStyle="warning">{message}</Alert>;
    }

    let title: string;

    if (numCanMove > 0) title = `Move ${numCanMove} ${canMoveNoun}`;
    else if (totalNum === 1) title = `Cannot Move ${capNounSingular}`;
    else title = `No ${capNounPlural} Can Be Moved`;

    return { message, title, canMove: numCanMove > 0 };
};
