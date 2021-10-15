import React, { FC, memo, useEffect, useState } from 'react';
import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';
import { operationRestrictionMessage, SampleOperation } from './constants';
import { ConfirmModal } from '../base/ConfirmModal';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';
import { OperationConfirmationData } from '../entities/models';
import { caseInsensitive } from '../../util/utils';

interface Props {
    operation: SampleOperation,
    confirmationData: OperationConfirmationData,
    api?: ComponentsAPIWrapper,
    aliquotIds?: any[],
}

function getOperationRestrictionMessage(operation: SampleOperation, numSamples: number, isAll?: boolean): string {
    if (isAll) {
        return operationRestrictionMessage[operation].all;
    } else {
        const messageInfo = operationRestrictionMessage[operation];
        let message;
        if (numSamples == 1) {
            message = operationRestrictionMessage[operation].singular + '.';
        } else {
            message = operationRestrictionMessage[operation].plural + '.'
        }
        if (messageInfo.recommendation) {
            return message + '. ' + messageInfo.recommendation;
        }
        return message;
    }
}

export const OperationNotPermittedMessage: FC<Props> = memo((props) => {

    const { operation, aliquotIds, confirmationData } = props;

    let notAllowedMsg = null;

    if (confirmationData) {
        if (confirmationData.noneAllowed) {
            return (
                <p>
                    All selected samples have a status that prevents {operationRestrictionMessage[operation].all}.
                </p>
            );
        }

        const onlyAliquots = aliquotIds?.length === confirmationData.totalCount;
        const noAliquots = !aliquotIds || aliquotIds.length == 0;
        let notAllowed = [];
        if (onlyAliquots || noAliquots) {
            notAllowed = confirmationData.notAllowed;
        } else { // some aliquots, some not
            notAllowed = confirmationData.notAllowed.filter(data => aliquotIds.indexOf(caseInsensitive(data, "rowId")) < 0);
        }
        if (notAllowed?.length > 0) {
            notAllowedMsg = (
                <p>
                    The current status of {notAllowed.length} selected sample{notAllowed.length == 1 ? ' ' : 's '}
                    prevents {getOperationRestrictionMessage(operation, notAllowed.length, false)}
                </p>
            );
        }
    }

    return notAllowedMsg;

});


OperationNotPermittedMessage.defaultProps = {
    api: getDefaultAPIWrapper(),
}

interface ModalProps {
    operation: SampleOperation
    onCancel: () => any;
    onConfirm: () => any;
    selectionKey: string;
    api?: ComponentsAPIWrapper,

}

export const SampleSelectionOperationModal: FC<ModalProps> = (props => {
    const { api, operation, onCancel, selectionKey } = props;
    const [confirmationData, setConfirmationData] = useState<OperationConfirmationData>(undefined);
    const [error, setError] = useState<string>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        api.samples.getSampleOperationConfirmationData(operation, selectionKey)
            .then((data) => {
                setConfirmationData(data);
                setError(undefined);
            })
            .catch((reason) => {
                console.error("There was a problem retrieving the update confirmation data.", reason);
                setError(resolveErrorMessage(reason));
            });
    }, [api]);

    if (isLoading) {
        return (
            <ConfirmModal title="Loading confirmation data" onCancel={onCancel} cancelButtonText="Cancel">
                <LoadingSpinner />
            </ConfirmModal>
        );
    }

    if (error) {
        return (
            <ConfirmModal
                title="Update Error"
                onCancel={onCancel}
                onConfirm={undefined}
                cancelButtonText="Dismiss"
            >
                <Alert>{error}</Alert>
            </ConfirmModal>
        );
    }
});
