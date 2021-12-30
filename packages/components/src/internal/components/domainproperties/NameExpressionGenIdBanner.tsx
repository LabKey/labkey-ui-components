import React, { FC, useCallback, useEffect, useState } from 'react';
import { Button, Col, FormControl, Row } from 'react-bootstrap';

import { Query } from '@labkey/api';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';
import { Alert, ConfirmModal, createNotification, LoadingSpinner } from '../../..';

export interface NameExpressionGenIdProps {
    api?: ComponentsAPIWrapper;
    dataTypeName: string; // sampletype or dataclass name
    rowId: number;
    kindName: 'SampleSet' | 'DataClass';
    dataTypeLSID?: string;
}

export const NameExpressionGenIdBanner: FC<NameExpressionGenIdProps> = props => {
    const { api, rowId, kindName, dataTypeName, dataTypeLSID } = props;
    const [currentGenId, setCurrentGenId] = useState<number>(undefined);
    const [newGenId, setNewGenId] = useState<number>(undefined);
    const [minNewGenId, setMinNewGenId] = useState<number>(undefined);
    const [error, setError] = useState<string>(undefined);
    const [canReset, setCanReset] = useState<boolean>(false);
    const [showResetDialog, setShowResetDialog] = useState<boolean>(false);
    const [showEditDialog, setShowEditDialog] = useState<boolean>(false);

    const init = async () => {
        if (rowId && kindName) {
            let dataCountSql = 'SELECT COUNT(*) AS DataCount FROM ';

            if (kindName === 'SampleSet') {
                dataCountSql += "materials WHERE sampleset = '" + dataTypeLSID + "'";
            } else {
                dataCountSql += 'data WHERE dataclass = ' + rowId;
            }

            Query.executeSql({
                schemaName: 'exp',
                sql: dataCountSql,
                success: async data => {
                    const canResetGen = data.rows[0].DataCount === 0;
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
                },
                failure: error => {
                    console.error(error);
                },
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
            await api.domain.setGenId(
                rowId,
                kindName,
                (newGenId ?? minNewGenId) - 1 /* Reset to N-1 so seq.next will be N. */
            );
            createNotification('Successfully updated genId.');
            init();
            setShowEditDialog(false);
        } catch (reason) {
            console.error(reason);
            setError(reason?.exception);
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
            await api.domain.setGenId(rowId, kindName, 0 /* Reset to 0 so seq.next will be 1. */);
            createNotification('Successfully resetted genId.');
            init();
            setShowResetDialog(false);
        } catch (reason) {
            console.error(reason);
            setError(reason?.exception);
        }
    }, [rowId, kindName]);

    if (currentGenId === undefined) return <LoadingSpinner />;

    return (
        <>
            <Alert bsStyle="info" className="genid-alert">
                Current genId: {currentGenId}
                <Button className="pull-right alert-button edit-genid-btn" bsStyle="info" onClick={onEditClick}>
                    Edit genId
                </Button>
                {canReset && currentGenId > 1 && (
                    <Button className="pull-right alert-button reset-genid-btn" bsStyle="info" onClick={onResetClick}>
                        Reset genId
                    </Button>
                )}
            </Alert>
            {showResetDialog && (
                <ConfirmModal
                    cancelButtonText="Cancel"
                    confirmButtonText="Reset"
                    onCancel={onResetCancel}
                    onConfirm={onResetConfirm}
                    title={`Are you sure you want to reset genId for ${dataTypeName}?`}
                >
                    {error && <Alert>{error}</Alert>}
                    <div>
                        The current genId is at {currentGenId}. Resetting will reset genId back to 1 and cannot be
                        undone.
                    </div>
                </ConfirmModal>
            )}
            {showEditDialog && (
                <ConfirmModal
                    cancelButtonText="Cancel"
                    confirmButtonText="Update"
                    onCancel={onEditCancel}
                    onConfirm={onEditConfirm}
                    title={`Are you sure you want to update genId for ${dataTypeName}?`}
                >
                    {error && <Alert>{error}</Alert>}
                    <div>
                        The current genId is at {currentGenId}. Updating genId will allow new{' '}
                        {kindName === 'SampleSet' ? 'sample' : 'data'} to use a new start value (min {minNewGenId}).
                        This action cannot be undone.
                    </div>
                    <Row className="margin-top">
                        <Col xs={5}>
                            <FormControl
                                className="update-genId-input "
                                min={minNewGenId}
                                step={1}
                                name="newgenidval"
                                onChange={(event: any) => setNewGenId(event?.target?.value)}
                                type="number"
                                value={newGenId ?? minNewGenId}
                                placeholder="Enter new genId..."
                            />
                        </Col>
                        <Col xs={7} />
                    </Row>
                </ConfirmModal>
            )}
        </>
    );
};

NameExpressionGenIdBanner.defaultProps = {
    api: getDefaultAPIWrapper(),
};
