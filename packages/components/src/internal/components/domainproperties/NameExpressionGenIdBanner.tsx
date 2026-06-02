/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback, useEffect, useState } from 'react';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';
import { useNotificationsContext } from '../notifications/NotificationsContext';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { Modal } from '../../Modal';

export interface NameExpressionGenIdProps {
    api?: ComponentsAPIWrapper;
    containerPath?: string;
    dataTypeLSID?: string;
    dataTypeName: string; // sampletype or dataclass name
    kindName: 'DataClass' | 'SampleSet';
    rowId: number;
}

export const GENID_SYNTAX_STRING = '${genId'; // skip closing tag to allow existence of formatter

export const NameExpressionGenIdBanner: FC<NameExpressionGenIdProps> = props => {
    const { api = getDefaultAPIWrapper(), containerPath, rowId, kindName, dataTypeName, dataTypeLSID } = props;
    const [currentGenId, setCurrentGenId] = useState<number>(undefined);
    const [newGenId, setNewGenId] = useState<number>(undefined);
    const [minNewGenId, setMinNewGenId] = useState<number>(undefined);
    const [error, setError] = useState<string>(undefined);
    const [canReset, setCanReset] = useState<boolean>(false);
    const [showResetDialog, setShowResetDialog] = useState<boolean>(false);
    const [showEditDialog, setShowEditDialog] = useState<boolean>(false);

    // useNotificationsContext will not always be available depending on if the app wraps the NotificationsContext.Provider
    let _createNotification;
    try {
        _createNotification = useNotificationsContext().createNotification;
    } catch (e) {
        // this is expected for LKS usages, so don't throw or console.error
    }

    const init = async () => {
        if (rowId && kindName) {
            try {
                const canResetGen = await api.entity.isDataTypeEmpty(
                    kindName === 'DataClass' ? 'DataClass' : 'SampleType',
                    dataTypeLSID,
                    rowId,
                    containerPath
                );
                setCanReset(canResetGen);

                try {
                    const genId = (await api.domain.getGenId(rowId, kindName)) + 1; // when creating new data, seq.next() will be used, so display the next number to users instead of current
                    setCurrentGenId(genId);
                    const minNewGenId = canResetGen ? 1 : genId;
                    setMinNewGenId(minNewGenId);
                    setNewGenId(minNewGenId);
                } catch (reason) {
                    console.error(reason);
                }
            } catch (reason) {
                console.error(reason);
            }
        }
    };

    useEffect(() => {
        init();
    }, [rowId, kindName]);

    const onEditClick = useCallback(() => {
        setShowEditDialog(true);
        setError(undefined);
    }, []);

    const onEditCancel = useCallback(() => {
        setShowEditDialog(false);
    }, []);

    const onEditConfirm = useCallback(async () => {
        const newGen = newGenId ?? minNewGenId;
        if (newGen === currentGenId) {
            setShowEditDialog(false);
            return;
        }

        try {
            await api.domain.setGenId(
                rowId,
                kindName,
                (newGenId ?? minNewGenId) - 1 /* Reset to N-1 so seq.next will be N. */
            );
            _createNotification?.('Successfully updated genId.');
            init();
            setShowEditDialog(false);
        } catch (reason) {
            console.error(reason);
            const error = reason?.error ?? reason;
            setError(resolveErrorMessage(error, 'genId', 'genId', 'edit'));
        }
    }, [rowId, kindName, newGenId, _createNotification]);

    const onResetClick = useCallback(() => {
        setShowResetDialog(true);
        setError(undefined);
    }, []);

    const onResetCancel = useCallback(() => {
        setShowResetDialog(false);
    }, []);

    const onResetConfirm = useCallback(async () => {
        try {
            await api.domain.setGenId(rowId, kindName, 0 /* Reset to 0 so seq.next will be 1. */);
            _createNotification?.('Successfully reset genId.');
            init();
            setShowResetDialog(false);
        } catch (reason) {
            console.error(reason);
            setError(resolveErrorMessage(reason, 'genId', 'genId', 'reset'));
        }
    }, [api, rowId, kindName, _createNotification, init]);

    if (currentGenId === undefined) return <LoadingSpinner />;

    return (
        <>
            <Alert bsStyle="info" className="genid-alert">
                Current genId: {currentGenId}
                <button
                    className="pull-right alert-button edit-genid-btn btn btn-primary"
                    onClick={onEditClick}
                    type="button"
                >
                    Edit genId
                </button>
                {canReset && currentGenId > 1 && (
                    <button
                        className="pull-right alert-button reset-genid-btn btn btn-primary"
                        onClick={onResetClick}
                        type="button"
                    >
                        Reset genId
                    </button>
                )}
            </Alert>
            {showResetDialog && (
                <Modal
                    confirmClass="btn-danger"
                    confirmText="Reset"
                    onCancel={onResetCancel}
                    onConfirm={onResetConfirm}
                    title={`Are you sure you want to reset genId for ${dataTypeName}?`}
                >
                    {error && <Alert>{error}</Alert>}
                    <div>
                        The current genId is at {currentGenId}. Resetting will reset genId back to 1 and cannot be
                        undone.
                    </div>
                </Modal>
            )}
            {showEditDialog && (
                <Modal
                    confirmClass="btn-danger"
                    confirmText="Update"
                    onCancel={onEditCancel}
                    onConfirm={onEditConfirm}
                    title={`Are you sure you want to update genId for ${dataTypeName}?`}
                >
                    {error && <Alert>{error}</Alert>}
                    <div>
                        The current genId is at {currentGenId}. Updating genId will allow new{' '}
                        {kindName === 'SampleSet' ? 'samples' : 'data'} to use a new start value (min {minNewGenId}).
                        This action cannot be undone.
                    </div>
                    <div className="row margin-top">
                        <div className="col-xs-5">
                            <input
                                aria-label="GenId value"
                                className="form-control update-genId-input "
                                min={minNewGenId}
                                name="newgenidval"
                                onChange={(event: any) => setNewGenId(event?.target?.value)}
                                placeholder="Enter new genId..."
                                step={1}
                                type="number"
                                value={newGenId ?? minNewGenId}
                            />
                        </div>
                        <div className="col-xs-7" />
                    </div>
                </Modal>
            )}
        </>
    );
};

NameExpressionGenIdBanner.displayName = 'NameExpressionGenIdBanner';
