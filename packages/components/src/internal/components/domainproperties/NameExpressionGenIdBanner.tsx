import React, { FC, useCallback, useEffect, useState } from 'react';
import { Button, FormControl } from "react-bootstrap";

import { Query } from "@labkey/api";

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';
import { Alert, ConfirmModal, LoadingSpinner } from '../../..';

export interface NameExpressionGenIdProps {
    api?: ComponentsAPIWrapper;
    dataTypeName: string; //sampletype or dataclass name
    dataTypeLSID: string;
    rowId: number;
    kindName: 'SampleSet' | "DataClass";
}

export const NameExpressionGenIdBanner: FC<NameExpressionGenIdProps> = props => {
    const { api, rowId, kindName, dataTypeName, dataTypeLSID } = props;
    const [currentGenId, setCurrentGenId] = useState<number>(undefined);
    const [newGenId, setNewGenId] = useState<number>(undefined);
    const [minNewGenId, setMinNewGenId] = useState<number>(undefined);
    const [error, setError] = useState<String>(undefined);
    const [canReset, setCanReset] = useState<boolean>(false);
    const [showResetDialog, setShowResetDialog] = useState<boolean>(false);
    const [showEditDialog, setShowEditDialog] = useState<boolean>(false);

    const init = async () => {
        if (rowId && kindName && dataTypeLSID) {
            const dataCountSql = 'SELECT COUNT(*) AS DataCount FROM ' + (kindName === 'SampleSet' ? 'material' : 'data') + " WHERE cpas = " + dataTypeLSID;

            Query.executeSql({
                schemaName: "exp",
                sql: dataCountSql,
                success: (async (data) => {
                    setCanReset(data.rows[0].DataCount === 0);

                    try {
                        const genId = await api.domain.getGenId(rowId, kindName);
                        setCurrentGenId(genId);
                        const minNewGenId = canReset ? 1 : currentGenId;
                        setMinNewGenId(minNewGenId);
                        setNewGenId(minNewGenId);
                    } catch (reason) {
                        console.error(reason);
                    }
                }),
                failure: (error => {
                    console.error(error);
                })
            });

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
            await api.domain.setGenId(rowId, kindName, newGenId ?? minNewGenId);
            setShowEditDialog(false);
        } catch (reason) {
            console.error(reason);
            setError(reason);
        }
    }, [rowId, kindName, newGenId]);

    const onResetClick = useCallback(() => {
        setShowResetDialog(true);
        setError(undefined);
    }, []);

    const onResetCancel = useCallback(() => {
        setShowResetDialog(false);
    }, []);

    const onResetConfirm = useCallback(async () => {
        try {
            await api.domain.setGenId(rowId, kindName, 1);
        } catch (reason) {
            console.error(reason);
            setError(reason);
        }
    }, [rowId, kindName]);

    if (!currentGenId)
        return <LoadingSpinner/>;

    return (
        <>
            {error && <Alert>{error}</Alert>}
            <Alert bsStyle="info" className="genid-alert">
                Current genId: ${currentGenId}
                <Button className="pull-right alert-button edit-genid-btn" bsStyle="info" onClick={onEditClick}>
                    Edit genId
                </Button>
                {(canReset && currentGenId > 0) && <Button className="pull-right alert-button reset-genid-btn" bsStyle="info" onClick={onResetClick}>
                    Reset genId
                </Button>}
            </Alert>
            {showResetDialog &&
                <ConfirmModal
                    cancelButtonText="Cancel"
                    confirmButtonText="Reset"
                    onCancel={onResetCancel}
                    onConfirm={onResetConfirm}
                    title={`Are you sure you want to reset genId for ${dataTypeName}?`}
                >
                    <div>
                        The current genId is at ${currentGenId}. Resetting will reset genId back to 1 and cannot be undone.
                    </div>
                    <FormControl
                        className="update-genId-input "
                        min={minNewGenId}
                        step={1}
                        name={"newgenidval"}
                        onChange={(event:any) => setNewGenId(event?.target?.value)}
                        type="number"
                        value={newGenId ?? minNewGenId}
                        placeholder={"Enter new genId..."}
                    />
                </ConfirmModal>
            }
            {showEditDialog &&
                <ConfirmModal
                    cancelButtonText="Cancel"
                    confirmButtonText="Update"
                    onCancel={onEditCancel}
                    onConfirm={onEditConfirm}
                    title={`Are you sure you want to reset genId for ${dataTypeName}?`}
                >
                    <span>
                        The current genId is at ${currentGenId}. Updating genId will allow new samples to use a new start value (min ${minNewGenId}). This action cannot be undone.
                    </span>
                </ConfirmModal>
            }
        </>
    );
};

NameExpressionGenIdBanner.defaultProps = {
    api: getDefaultAPIWrapper(),
};
