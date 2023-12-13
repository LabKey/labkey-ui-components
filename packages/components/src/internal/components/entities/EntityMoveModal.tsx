import React, { FC, memo, useCallback, useEffect, useState } from 'react';

import { ActionURL } from '@labkey/api';

import { Progress } from '../base/Progress';
import { ConfirmModal } from '../base/ConfirmModal';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { Container } from '../base/models/Container';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { useNotificationsContext } from '../notifications/NotificationsContext';
import { capitalizeFirstChar } from '../../util/utils';
import { setSnapshotSelections } from '../../actions';
import { HelpLink, MOVE_SAMPLES_TOPIC } from '../../util/helpLinks';

import { isLoading, LoadingState } from '../../../public/LoadingState';

import { AppURL, buildURL } from '../../url/AppURL';

import { getPrimaryAppProperties } from '../../app/utils';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { EntityDataType, OperationConfirmationData } from './models';
import { getEntityNoun } from './utils';
import { EntityMoveConfirmationModal } from './EntityMoveConfirmationModal';

export interface EntityMoveModalProps {
    api?: ComponentsAPIWrapper;
    currentContainer?: Container; // used in the single move case when the item is not in the current container
    dataTypeRowId?: number;
    entityDataType: EntityDataType;
    maxSelected: number;
    onAfterMove: () => void;
    onCancel: () => void;
    queryModel: QueryModel;
    targetAppURL?: AppURL;
    useSelected: boolean;
}

export const EntityMoveModal: FC<EntityMoveModalProps> = memo(props => {
    const {
        api = getDefaultAPIWrapper(),
        onAfterMove,
        currentContainer,
        queryModel,
        onCancel,
        useSelected,
        entityDataType,
        maxSelected,
        targetAppURL,
        dataTypeRowId,
    } = props;
    const { nounPlural } = entityDataType;
    const { createNotification } = useNotificationsContext();
    const [confirmationData, setConfirmationData] = useState<OperationConfirmationData>();
    const [loading, setLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [error, setError] = useState<string>();
    const [showProgress, setShowProgress] = useState<boolean>(false);
    const [numConfirmed, setNumConfirmed] = useState<number>(0);

    let rowIds;
    let numSelected = 0;
    let selectionKey: string;
    if (useSelected) {
        selectionKey = queryModel.selectionKey;
    } else if (queryModel.hasData) {
        rowIds = [Object.keys(queryModel.rows)[0]];
        numSelected = 1;
    }

    useEffect(
        () => {
            (async () => {
                setLoading(LoadingState.LOADING);

                try {
                    const useSnapshotSelection = queryModel?.filterArray.length > 0;
                    if (useSnapshotSelection) await setSnapshotSelections(selectionKey, [...queryModel.selections]);
                    const confirmationData_ = await api.entity.getMoveConfirmationData(
                        entityDataType,
                        rowIds,
                        selectionKey,
                        useSnapshotSelection
                    );
                    setConfirmationData(confirmationData_);
                } catch (e) {
                    console.error('There was a problem retrieving the move confirmation data.', e);
                    setError('There was a problem retrieving the move confirmation data.');
                } finally {
                    setLoading(LoadingState.LOADED);
                }
            })();
        },
        [
            /* on mount only */
        ]
    );

    const onConfirm = useCallback(
        async (targetContainerPath: string, targetName: string, auditUserComment: string) => {
            const movingAll = confirmationData.notAllowed.length === 0;
            const count = confirmationData.allowed.length;
            const noun = getEntityNoun(entityDataType, count)?.toLowerCase();
            setNumConfirmed(count);
            setShowProgress(true);

            const rowIds_ =
                !useSelected || !movingAll
                    ? confirmationData.allowed.map(a => {
                          if (a.RowId) return a.RowId;
                          return a;
                      })
                    : undefined;
            const useSnapshotSelection = useSelected && movingAll && queryModel.filterArray.length > 0;

            try {
                await api.entity.moveEntities(
                    currentContainer,
                    targetContainerPath,
                    entityDataType,
                    queryModel.queryName,
                    rowIds_,
                    selectionKey,
                    useSnapshotSelection,
                    auditUserComment
                );

                let projectUrl = buildURL(
                    getPrimaryAppProperties()?.productId,
                    `${ActionURL.getAction() || 'app'}.view`,
                    undefined,
                    { container: targetContainerPath, returnUrl: false }
                );
                if (targetAppURL) {
                    projectUrl = projectUrl + targetAppURL.toHref();
                }

                createNotification(
                    {
                        message: (
                            <>
                                Successfully moved {count} {noun} to <a href={projectUrl}>{targetName}</a>.
                            </>
                        ),
                        alertClass: 'success',
                    },
                    true
                );
                onAfterMove();
            } catch (message) {
                setShowProgress(false);
                createNotification(
                    { alertClass: 'danger', message: 'There was a problem moving the ' + noun + '. ' + message },
                    true
                );
                if (useSelected) onAfterMove();
            } finally {
                onCancel();
            }
        },
        [
            currentContainer,
            confirmationData,
            entityDataType,
            useSelected,
            queryModel.queryName,
            queryModel.filterArray.length,
            selectionKey,
            targetAppURL,
            createNotification,
            onAfterMove,
            onCancel,
        ]
    );

    if (useSelected && maxSelected && numSelected > maxSelected) {
        return (
            <ConfirmModal
                title={'Cannot Move ' + capitalizeFirstChar(nounPlural)}
                onCancel={onCancel}
                cancelButtonText="Dismiss"
            >
                You cannot move more than {maxSelected} individual {nounPlural.toLowerCase()} at a time. Please select
                fewer {nounPlural.toLowerCase()} and try again.
            </ConfirmModal>
        );
    }

    if (isLoading(loading)) {
        return (
            <ConfirmModal title="Move to Project" onCancel={onCancel} cancelButtonText="Cancel">
                <LoadingSpinner msg="Loading confirmation data..." />
            </ConfirmModal>
        );
    }

    if (error) {
        return (
            <ConfirmModal title="Move to Project" onCancel={onCancel} cancelButtonText="Dismiss">
                <Alert>{error}</Alert>
            </ConfirmModal>
        );
    }

    const { canMove, message, title } = getMoveConfirmationProperties(
        confirmationData,
        entityDataType.nounSingular,
        entityDataType.nounPlural
    );

    if (!canMove) {
        return (
            <ConfirmModal
                title={'Cannot Move ' + capitalizeFirstChar(nounPlural)}
                onCancel={onCancel}
                cancelButtonText="Dismiss"
            >
                {message}
            </ConfirmModal>
        );
    }

    return (
        <>
            {!showProgress && (
                <EntityMoveConfirmationModal
                    cancelButtonText="Cancel"
                    confirmButtonText="Move"
                    nounPlural={nounPlural}
                    onCancel={onCancel}
                    onConfirm={onConfirm}
                    currentContainer={currentContainer}
                    title={title}
                    dataType={entityDataType.projectConfigurableDataType}
                    dataTypeRowId={dataTypeRowId}
                >
                    {message}
                </EntityMoveConfirmationModal>
            )}
            <Progress
                modal={true}
                estimate={numConfirmed * 10}
                title={`Moving ${numConfirmed} ${getEntityNoun(entityDataType, numConfirmed)}`}
                toggle={showProgress}
            />
        </>
    );
});

// exported for jest testing
export const getMoveConfirmationProperties = (
    confirmationData: OperationConfirmationData,
    nounSingular: string,
    nounPlural: string
): { canMove: boolean; message: any; title: string } => {
    if (!confirmationData) return undefined;

    const capNounSingular = capitalizeFirstChar(nounSingular);
    const capNounPlural = capitalizeFirstChar(nounPlural);
    const dependencyText = 'status that prevents moving';
    const numCanMove = confirmationData.allowed.length;
    const numCannotMove = confirmationData.notAllowed.length;
    const canMoveNoun = numCanMove === 1 ? capNounSingular : capNounPlural;
    const cannotMoveNoun = numCannotMove === 1 ? nounSingular : nounPlural;
    const totalNum = numCanMove + numCannotMove;
    const totalNoun = totalNum === 1 ? nounSingular : nounPlural;

    let text;
    if (totalNum === 0) {
        text =
            'Either no ' +
            nounPlural +
            ' are selected for moving or the selected ' +
            nounPlural +
            ' are no longer valid.';
    } else if (numCannotMove === 0) {
        text = totalNum === 1 ? 'The selected ' : totalNum === 2 ? 'Both ' : 'All ' + totalNum + ' ';
        text += totalNoun + ' will be moved.';
    } else if (numCanMove === 0) {
        if (totalNum === 1) {
            text = 'The ' + totalNoun + " you've selected cannot be moved because it has a " + dependencyText + '.  ';
        } else {
            text = numCannotMove === 2 ? 'Neither of' : 'None of';
            text += ' the ' + totalNum + ' ' + totalNoun + " you've selected can be moved";
            text += ' because they have a ' + dependencyText + '.';
        }
    } else {
        text = [];
        let firstText = "You've selected " + totalNum + ' ' + totalNoun + ' but only ' + numCanMove + ' can be moved. ';
        firstText += numCannotMove + ' ' + cannotMoveNoun + ' cannot be moved because ';
        firstText += (numCannotMove === 1 ? ' it has ' : ' they have ') + dependencyText + '.';
        text.push(<React.Fragment key="commonText">{firstText}</React.Fragment>);
    }

    let message;
    if (numCannotMove > 0) {
        message = (
            <>
                {text}
                <>
                    &nbsp;(<HelpLink topic={MOVE_SAMPLES_TOPIC}>more info</HelpLink>)
                </>
            </>
        );
    }
    if (numCanMove > 0 && numCannotMove > 0) {
        message = <Alert bsStyle="warning">{message}</Alert>;
    }

    return {
        message,
        title:
            numCanMove > 0
                ? 'Move ' + numCanMove + ' ' + canMoveNoun
                : totalNum === 1
                ? 'Cannot Move ' + capNounSingular
                : 'No ' + capNounPlural + ' Can Be Moved',
        canMove: numCanMove > 0,
    };
};
