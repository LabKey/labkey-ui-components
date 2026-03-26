import React, { FC, memo, ReactNode, useCallback, useEffect, useState } from 'react';

import { Progress } from '../base/Progress';
import { Modal } from '../../Modal';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { Container } from '../base/models/Container';
import { useNotificationsContext } from '../notifications/NotificationsContext';
import { capitalizeFirstChar, makeCommaSeparatedString, pronoun } from '../../util/utils';
import { HelpLink, MOVE_SAMPLES_TOPIC } from '../../util/helpLinks';
import { isLoading, LoadingState } from '../../../public/LoadingState';
import { AppURL } from '../../url/AppURL';
import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';
import { EntityDataType, OperationConfirmationData } from './models';
import { getEntityNoun } from './utils';
import { EntityMoveConfirmationModal } from './EntityMoveConfirmationModal';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { AppLink } from '../../url/AppLink';
import { Security } from '@labkey/api';

export interface EntityMoveModalProps {
    api?: ComponentsAPIWrapper;
    currentContainer?: Container; // used in the single move case when the item is not in the current container
    dataTypeRowId?: number;
    entityDataType: EntityDataType;
    maxSelected: number;
    onAfterMove: () => void;
    onCancel: () => void;
    permissionType?: Security.PermissionTypes;
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
        permissionType,
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
        entityDataType.nounPlural,
        rowIds.length
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
                    permissionType={permissionType}
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

// exported for jest testing
export const getMoveConfirmationProperties = (
    confirmationData: OperationConfirmationData,
    nounSingular: string,
    nounPlural: string,
    selectedCount: number
): { canMove: boolean; message: ReactNode; title: string } => {
    if (!confirmationData) return undefined;

    const capNounSingular = capitalizeFirstChar(nounSingular);
    const capNounPlural = capitalizeFirstChar(nounPlural);
    const numCanMove = confirmationData.totalActionable;
    const numMissing = selectedCount - confirmationData.totalCount;
    const numCannotMove = confirmationData.totalNotActionable + numMissing;
    const numNotAllowed = confirmationData.notAllowed.length;
    const numNotPermitted = confirmationData.notPermitted.length;
    const canMoveNoun = numCanMove === 1 ? capNounSingular : capNounPlural;
    const noun = selectedCount === 1 ? nounSingular : nounPlural;

    let text: string;
    if (numCannotMove === 0) {
        if (selectedCount === 1) text = 'The selected';
        else if (selectedCount == 2) text = 'Both';
        else text = `All ${selectedCount}`;
        text = `${text} ${noun} will be moved.`;
    } else {
        const cannotMoveNoun = numCannotMove === 1 ? nounSingular : nounPlural;
        const _pronoun = pronoun(numCannotMove, 'they');
        const verb = numCannotMove === 1 ? 'has' : 'have';
        const parts = [];
        if (numNotPermitted > 0) parts.push('you lack the proper permissions');
        if (numNotAllowed > 0) parts.push(`${_pronoun} ${verb} a status or related data that prevents moving`);
        if (numMissing > 0) parts.push(`${_pronoun} may have been deleted`);
        const error = makeCommaSeparatedString(parts, ', or ', '.');

        if (numCanMove === 0) {
            text = `Cannot move the selected ${cannotMoveNoun}. ${capitalizeFirstChar(error)}`;
        } else {
            text = `You've selected ${selectedCount} ${noun} but only ${numCanMove} can be moved. `;
            text += `${numCannotMove} ${cannotMoveNoun} cannot be moved because ${error}`;
        }
    }

    let message;

    if (numCannotMove > 0) {
        message = (
            <>
                {text} <HelpLink topic={MOVE_SAMPLES_TOPIC}>More info</HelpLink>.
            </>
        );
    }
    if (numCanMove > 0 && numCannotMove > 0) {
        message = <Alert bsStyle="warning">{message}</Alert>;
    }

    let title: string;

    if (numCanMove > 0) title = `Move ${numCanMove} ${canMoveNoun}`;
    else if (selectedCount === 1) title = `Cannot Move ${capNounSingular}`;
    else title = `No ${capNounPlural} Can Be Moved`;

    return { message, title, canMove: numCanMove > 0 };
};
