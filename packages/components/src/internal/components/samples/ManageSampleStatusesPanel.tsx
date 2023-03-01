import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { FormGroup, Button } from 'react-bootstrap';
import { List } from 'immutable';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { LockIcon } from '../base/LockIcon';
import { ConfirmModal } from '../base/ConfirmModal';
import { ChoicesListItem } from '../base/ChoicesListItem';

import { AddEntityButton } from '../buttons/AddEntityButton';
import { DomainFieldLabel } from '../domainproperties/DomainFieldLabel';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { SelectInput } from '../forms/input/SelectInput';
import { selectRowsDeprecated, updateRows, insertRows, deleteRows } from '../../query/api';
import { caseInsensitive } from '../../util/utils';
import { SCHEMAS } from '../../schemas';
import { resolveErrorMessage } from '../../util/messaging';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { DisableableButton } from '../buttons/DisableableButton';

import { InjectedRouteLeaveProps } from '../../util/RouteLeave';

import { SampleState } from './models';

const TITLE = 'Manage Sample Statuses';
const STATE_TYPE_SQ = new SchemaQuery('exp', 'SampleStateType');
const DEFAULT_TYPE_OPTIONS = [{ value: 'Available' }, { value: 'Consumed' }, { value: 'Locked' }];
const NEW_STATUS_INDEX = -1;
const SAMPLE_STATUS_LOCKED_TITLE = 'Sample Status Locked';
const SAMPLE_STATUS_LOCKED_TIP = 'This sample status cannot change status type or be deleted because it is in use.';

interface SampleStatusDetailProps {
    addNew: boolean;
    onActionComplete: (newStatusLabel?: string, isDelete?: boolean) => void;
    onChange: () => void;
    state: SampleState;
}

// exported for jest testing
export const SampleStatusDetail: FC<SampleStatusDetailProps> = memo(props => {
    const { state, addNew, onActionComplete, onChange } = props;
    const [typeOptions, setTypeOptions] = useState<Array<Record<string, any>>>();
    const [updatedState, setUpdatedState] = useState<SampleState>();
    const [dirty, setDirty] = useState<boolean>();
    const [saving, setSaving] = useState<boolean>();
    const [error, setError] = useState<string>();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>();

    useEffect(() => {
        selectRowsDeprecated({
            schemaName: STATE_TYPE_SQ.schemaName,
            queryName: STATE_TYPE_SQ.queryName,
            columns: 'RowId,Value',
        })
            .then(({ key, models, orderedModels }) => {
                const data = orderedModels[key]
                    .map(id => {
                        return { value: caseInsensitive(models[key][id], 'Value').value };
                    })
                    .toArray();
                setTypeOptions(data);
            })
            .catch(reason => {
                console.error(reason);
                setTypeOptions(DEFAULT_TYPE_OPTIONS);
            });
    }, []);

    const resetState = useCallback(() => {
        setSaving(false);
        setShowDeleteConfirm(false);
        setError(undefined);
    }, []);

    useEffect(() => {
        if (addNew) {
            setUpdatedState(new SampleState({ stateType: typeOptions?.[0]?.value }));
        } else {
            setUpdatedState(state);
        }
        setDirty(addNew);
        if (addNew) onChange();
        resetState();
    }, [state, addNew, typeOptions, resetState, onChange]);

    const onFormChange = useCallback(
        (evt): void => {
            const { name, value } = evt.target;
            setUpdatedState(updatedState.set(name, value));
            setDirty(true);
            onChange();
        },
        [updatedState, onChange]
    );

    const onSelectChange = useCallback(
        (name, value): void => {
            setUpdatedState(updatedState.set(name, value));
            setDirty(true);
            onChange();
        },
        [updatedState, onChange]
    );

    const onCancel = useCallback(() => {
        onActionComplete(undefined, true);
    }, [onActionComplete]);

    const onSave = useCallback(() => {
        setError(undefined);
        setSaving(true);

        // trim the label string before saving
        const stateToSave = updatedState.set('label', updatedState.label?.trim());

        if (stateToSave.rowId) {
            updateRows({
                schemaQuery: SCHEMAS.CORE_TABLES.DATA_STATES,
                rows: [stateToSave],
            })
                .then(() => {
                    onActionComplete(stateToSave.label);
                })
                .catch(reason => {
                    setError(resolveErrorMessage(reason, 'status', 'statuses', 'updating'));
                    setSaving(false);
                });
        } else {
            insertRows({
                schemaQuery: SCHEMAS.CORE_TABLES.DATA_STATES,
                rows: List([stateToSave]),
            })
                .then(() => {
                    onActionComplete(stateToSave.label);
                })
                .catch(response => {
                    setError(resolveErrorMessage(response.get('error'), 'status', 'statuses', 'inserting'));
                    setSaving(false);
                });
        }
    }, [updatedState, onActionComplete]);

    const onToggleDeleteConfirm = useCallback(() => setShowDeleteConfirm(!showDeleteConfirm), [showDeleteConfirm]);
    const onDeleteConfirm = useCallback(() => {
        if (updatedState.rowId) {
            deleteRows({
                schemaQuery: SCHEMAS.CORE_TABLES.DATA_STATES,
                rows: [updatedState],
            })
                .then(() => {
                    onActionComplete(undefined, true);
                })
                .catch(reason => {
                    setError(resolveErrorMessage(reason, 'status', 'statuses', 'deleting'));
                    setShowDeleteConfirm(false);
                });
        } else {
            setShowDeleteConfirm(false);
        }
    }, [updatedState, onActionComplete]);

    return (
        <>
            {/* using null for state value to indicate that we don't want to show the empty message*/}
            {!updatedState && state !== null && (
                <p className="choices-detail__empty-message">Select a sample status to view details.</p>
            )}
            {updatedState && (
                <form className="form-horizontal content-form">
                    {error && <Alert>{error}</Alert>}
                    <FormGroup>
                        <div className="col-sm-4">
                            <DomainFieldLabel label="Label" required />
                        </div>
                        <div className="col-sm-8">
                            <input
                                className="form-control"
                                name="label"
                                onChange={onFormChange}
                                disabled={saving}
                                placeholder="Enter status label"
                                type="text"
                                value={updatedState.label ?? ''}
                            />
                        </div>
                    </FormGroup>
                    <FormGroup>
                        <div className="col-sm-4">
                            <DomainFieldLabel label="Description" />
                        </div>
                        <div className="col-sm-8">
                            <textarea
                                className="form-control"
                                name="description"
                                onChange={onFormChange}
                                disabled={saving}
                                value={updatedState.description ?? ''}
                            />
                        </div>
                    </FormGroup>
                    <FormGroup>
                        <div className="col-sm-4">
                            <DomainFieldLabel label="Status Type" required />
                        </div>
                        <div className="col-sm-8">
                            <SelectInput
                                name="stateType"
                                inputClass="col-sm-12"
                                labelKey="value"
                                clearable={false}
                                onChange={onSelectChange}
                                disabled={updatedState.inUse || saving}
                                options={typeOptions}
                                value={updatedState.stateType}
                            />
                        </div>
                    </FormGroup>
                    <div>
                        {!addNew && (
                            <DisableableButton
                                bsStyle="default"
                                disabledMsg={updatedState.inUse || saving ? SAMPLE_STATUS_LOCKED_TIP : undefined}
                                onClick={onToggleDeleteConfirm}
                                title={SAMPLE_STATUS_LOCKED_TITLE}
                            >
                                <span className="fa fa-trash" />
                                <span>&nbsp;Delete</span>
                            </DisableableButton>
                        )}
                        {addNew && (
                            <Button bsStyle="default" disabled={saving} onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                        <Button bsStyle="success" className="pull-right" disabled={!dirty || saving} onClick={onSave}>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            )}
            {showDeleteConfirm && (
                <ConfirmModal
                    cancelButtonText="Cancel"
                    confirmButtonText="Yes, Delete"
                    onCancel={onToggleDeleteConfirm}
                    onConfirm={onDeleteConfirm}
                    title="Permanently Delete Status?"
                >
                    <span>
                        The <b>{updatedState.label}</b> status will be permanently deleted.
                        <p className="top-spacing">
                            <strong>Deletion cannot be undone.</strong> Do you want to proceed?
                        </p>
                    </span>
                </ConfirmModal>
            )}
        </>
    );
});
SampleStatusDetail.displayName = 'SampleStatusDetail';

interface SampleStatusesListProps {
    onSelect: (index: number) => void;
    selected: number;
    states: SampleState[];
}

// exported for jest testing
export const SampleStatusesList: FC<SampleStatusesListProps> = memo(props => {
    const { states, onSelect, selected } = props;

    return (
        <div className="list-group">
            {states.map((state, index) => (
                <ChoicesListItem
                    active={index === selected}
                    index={index}
                    subLabel={state.stateType !== state.label && state.stateType}
                    key={state.rowId}
                    label={state.label}
                    onSelect={onSelect}
                    componentRight={
                        state.inUse && (
                            <LockIcon
                                iconCls="pull-right choices-list__locked"
                                body={SAMPLE_STATUS_LOCKED_TIP}
                                id="sample-state-lock-icon"
                                title={SAMPLE_STATUS_LOCKED_TITLE}
                            />
                        )
                    }
                />
            ))}
            {states.length === 0 && <p className="choices-list__empty-message">No sample statuses defined.</p>}
        </div>
    );
});
SampleStatusesList.displayName = 'SampleStatusesList';

interface ManageSampleStatusesPanelProps extends InjectedRouteLeaveProps {
    api?: ComponentsAPIWrapper;
}

export const ManageSampleStatusesPanel: FC<ManageSampleStatusesPanelProps> = memo(props => {
    const { api, setIsDirty } = props;
    const [states, setStates] = useState<SampleState[]>();
    const [error, setError] = useState<string>();
    const [selected, setSelected] = useState<number>();
    const addNew = useMemo(() => selected === NEW_STATUS_INDEX, [selected]);

    const querySampleStatuses = useCallback(
        (newStatusLabel?: string) => {
            setError(undefined);

            api.samples
                .getSampleStatuses(true)
                .then(statuses => {
                    setStates(statuses);
                    if (newStatusLabel) setSelected(statuses.findIndex(state => state.label === newStatusLabel));
                })
                .catch(() => {
                    setStates([]);
                    setError('Error: Unable to load sample statuses.');
                });
        },
        [api]
    );

    useEffect(() => {
        querySampleStatuses();
    }, [querySampleStatuses]);

    const onSetSelected = useCallback((index: number) => {
        setSelected(index);
    }, []);

    const onAddState = useCallback(() => {
        setSelected(NEW_STATUS_INDEX);
    }, []);

    const onChange = useCallback(() => {
        setIsDirty(true);
    }, [setIsDirty]);

    const onActionComplete = useCallback(
        (newStatusLabel?: string, isDelete = false) => {
            querySampleStatuses(newStatusLabel);
            if (isDelete) setSelected(undefined);
            setIsDirty(false);
        },
        [querySampleStatuses, setIsDirty]
    );

    return (
        <div className="panel panel-default">
            <div className="panel-heading">{TITLE}</div>
            <div className="panel-body">
                {error && <Alert>{error}</Alert>}
                {!states && <LoadingSpinner />}
                {states && !error && (
                    <div className="row choices-container">
                        <div className="col-lg-4 col-md-6 choices-container-left-panel">
                            <SampleStatusesList states={states} selected={selected} onSelect={onSetSelected} />
                            <AddEntityButton onClick={onAddState} entity="New Status" disabled={addNew} />
                        </div>
                        <div className="col-lg-8 col-md-6">
                            <SampleStatusDetail
                                // use null to indicate that no statuses exist to be selected, so don't show the empty message
                                state={states.length === 0 ? null : states[selected]}
                                addNew={addNew}
                                onActionComplete={onActionComplete}
                                onChange={onChange}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

ManageSampleStatusesPanel.defaultProps = {
    api: getDefaultAPIWrapper(),
};

ManageSampleStatusesPanel.displayName = 'ManageSampleStatusesPanel';
