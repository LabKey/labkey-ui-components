import React, { FC, memo, useCallback, useEffect, useState } from 'react';

import { Progress } from '../base/Progress';
import { ConfirmModal } from '../base/ConfirmModal';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { Actions } from '../../../public/QueryModel/withQueryModels';

import { useNotificationsContext } from '../notifications/NotificationsContext';
import { capitalizeFirstChar } from '../../util/utils';
import { setSnapshotSelections } from '../../actions';
import { HelpLink, MOVE_SAMPLES_TOPIC } from '../../util/helpLinks';

import { isLoading, LoadingState } from '../../../public/LoadingState';

import { getMoveConfirmationData } from './actions';
import { EntityDataType, OperationConfirmationData } from './models';
import { getEntityNoun } from './utils';
import { EntityMoveConfirmationModal } from './EntityMoveConfirmationModal';
import {buildURL} from "../../url/AppURL";
import {ActionURL} from "@labkey/api";
import {getCurrentAppProperties} from "../../app/utils";

interface Props {
    actions: Actions;
    entityDataType: EntityDataType;
    maxSelected: number;
    moveFn: (targetContainer: string, rowIds: number[], selectionKey: string, auditUserComment: string) => void;
    onCancel: () => void;
    queryModel: QueryModel;
    useSelected: boolean;
}

export const EntityMoveModal: FC<Props> = memo(props => {
    const { actions, queryModel, onCancel, useSelected, entityDataType, maxSelected, moveFn } = props;
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
                    const confirmationData_ = await getMoveConfirmationData(
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
        [/* on mount only */]
    );

    const onConfirm = useCallback(
        async (targetContainer: string, auditUserComment: string) => {
            const movingAll = confirmationData.notAllowed.length === 0;
            const count = confirmationData.allowed.length;
            const noun = getEntityNoun(entityDataType, count);
            setNumConfirmed(count);
            setShowProgress(true);

            try {
                await moveFn(
                    targetContainer,
                    !movingAll ? confirmationData.allowed.map(a => a.RowId) : undefined,
                    movingAll ? selectionKey : undefined, // TODO need useSnapshotSelection?
                    auditUserComment
                );

                const projectUrl = buildURL(
                    getCurrentAppProperties().controllerName,
                    `${ActionURL.getAction() || 'app'}.view`,
                    undefined,
                    { container: targetContainer, returnUrl: false }
                );

                createNotification({
                    message: (
                        <>
                             Successfully moved {count} {noun}.
                             Go to <a href={projectUrl}>target project</a>.
                            {/*TODO go to sample type page, that likely means we need to move this to the SampleMoveMenuItem */}
                         </>
                    ),
                    alertClass: 'success',
                });
            } catch (message) {
                setShowProgress(false);
                createNotification({
                    alertClass: 'danger',
                    message: 'There was a problem moving the ' + noun + '. ' + message,
                });
            } finally {
                actions.loadModel(queryModel.id, true, true);
                onCancel();
            }
        },
        [actions, confirmationData, createNotification, entityDataType, moveFn, onCancel, queryModel.id, selectionKey]
    );

    if (useSelected && maxSelected && numSelected > maxSelected) {
        return (
            <ConfirmModal
                title={'Cannot Move ' + capitalizeFirstChar(nounPlural)}
                onCancel={onCancel}
                cancelButtonText="Dismiss"
            >
                You cannot move more than {maxSelected} individual {nounPlural} at a time. Please select fewer{' '}
                {nounPlural} and try again.
            </ConfirmModal>
        );
    }

    if (isLoading(loading)) {
        return (
            <ConfirmModal title="Move to Project" onCancel={onCancel} cancelButtonText="Cancel">
                <LoadingSpinner msg="Loading confirmation data" />
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
                <Alert>{message}</Alert>
            </ConfirmModal>
        );
    }

    return (
        <>
            {!showProgress && (
                <EntityMoveConfirmationModal
                    cancelButtonText="Cancel"
                    confirmButtonText="Move"
                    onCancel={onCancel}
                    onConfirm={onConfirm}
                    title={title}
                >
                    {message}
                </EntityMoveConfirmationModal>
            )}
            <Progress
                modal={true}
                estimate={numConfirmed * 10} // TODO update estimate accordingly
                title={`Moving ${numConfirmed} ${getEntityNoun(entityDataType, numConfirmed)}`}
                toggle={showProgress}
            />
        </>
    );
});

const getMoveConfirmationProperties = (
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
            <Alert bsStyle="warning">
                {text}
                {numCannotMove > 0 && (
                    <>
                        &nbsp;(<HelpLink topic={MOVE_SAMPLES_TOPIC}>more info</HelpLink>)
                    </>
                )}
            </Alert>
        );
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
