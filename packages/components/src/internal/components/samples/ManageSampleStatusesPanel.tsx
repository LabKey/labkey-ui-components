import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { FormGroup, Button } from 'react-bootstrap';
import { List } from 'immutable';
import classNames from 'classnames';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { LockIcon } from '../base/LockIcon';
import { ConfirmModal } from '../base/ConfirmModal';

import { AddEntityButton } from '../buttons/AddEntityButton';
import { DomainFieldLabel } from '../domainproperties/DomainFieldLabel';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { SelectInput } from '../forms/input/SelectInput';
import { selectRows, updateRows, insertRows, deleteRows } from '../../query/api';
import { caseInsensitive } from '../../util/utils';
import { SCHEMAS } from '../../schemas';
import { resolveErrorMessage } from '../../util/messaging';
import { SampleState } from './actions';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

const TITLE = 'Manage Sample Statuses';
const STATE_TYPE_SQ = SchemaQuery.create('exp', 'SampleStateType');
const DEFAULT_TYPE_OPTIONS = [{ value: 'Available' }, { value: 'Consumed' }, { value: 'Locked' }];
const NEW_STATUS_INDEX = -1;

interface SampleStatusDetailProps {
    addNew: boolean;
    onActionComplete: (newStatusLabel?: string, isDelete?: boolean) => void;
    state: SampleState;
}

const SampleStatusDetail: FC<SampleStatusDetailProps> = memo(props => {
    const { state, addNew, onActionComplete } = props;
    const [typeOptions, setTypeOptions] = useState<Array<Record<string, any>>>();
    const [updatedState, setUpdatedState] = useState<SampleState>();
    const [dirty, setDirty] = useState<boolean>();
    const [saving, setSaving] = useState<boolean>();
    const [error, setError] = useState<string>();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>();

    useEffect(() => {
        selectRows({
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

    useEffect(() => {
        if (addNew) {
            setUpdatedState(new SampleState({ stateType: typeOptions?.[0]?.value }));
        } else {
            setUpdatedState(state);
        }
        setDirty(addNew);
        setSaving(false);
        setShowDeleteConfirm(false);
        setError(undefined);
    }, [state, addNew, typeOptions]);

    const onFormChange = useCallback(
        (evt): void => {
            const { name, value } = evt.target;
            setUpdatedState(updatedState.set(name, value));
            setDirty(true);
        },
        [updatedState]
    );

    const onSelectChange = useCallback(
        (name, value): void => {
            setUpdatedState(updatedState.set(name, value));
            setDirty(true);
        },
        [updatedState]
    );

    const onSave = useCallback(() => {
        setError(undefined);
        setSaving(true);
        if (updatedState.rowId) {
            updateRows({
                schemaQuery: SCHEMAS.CORE_TABLES.DATA_STATES,
                rows: [updatedState],
            })
                .then(() => {
                    onActionComplete(updatedState.label);
                })
                .catch(reason => {
                    setError(resolveErrorMessage(reason, 'status', 'statuses', 'updating'));
                    setSaving(false);
                });
        } else {
            insertRows({
                schemaQuery: SCHEMAS.CORE_TABLES.DATA_STATES,
                rows: List([updatedState]),
            })
                .then(() => {
                    onActionComplete(updatedState.label);
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
                            <Button
                                bsStyle="default"
                                disabled={updatedState.inUse || saving}
                                onClick={onToggleDeleteConfirm}
                            >
                                <span className="fa fa-trash" />
                                <span>&nbsp;Delete</span>
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
                    title="Permanently delete status?"
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

interface SampleStatusesListItemProps {
    active?: boolean;
    index: number;
    onSelect: (index: number) => void;
    state: SampleState;
}

const SampleStatusesListItem: FC<SampleStatusesListItemProps> = memo(props => {
    const { state, index, active, onSelect } = props;
    const onClick = useCallback(() => {
        onSelect(index);
    }, [onSelect, index]);

    return (
        <button className={classNames('list-group-item', { active })} onClick={onClick} type="button">
            {state.label}
            {state.stateType !== state.label && <span className="choices-list__item-type">{state.stateType}</span>}
            {state.inUse && (
                <LockIcon
                    iconCls="pull-right choices-list__locked"
                    body={<p>This sample status cannot change status type or be deleted because it is in use.</p>}
                    id="sample-state-lock-icon"
                    title="Sample Status Locked"
                />
            )}
        </button>
    );
});
SampleStatusesListItem.displayName = 'SampleStatusesListItem';

interface SampleStatusesListProps {
    onSelect: (index: number) => void;
    selected: number;
    states: SampleState[];
}

const SampleStatusesList: FC<SampleStatusesListProps> = memo(props => {
    const { states, onSelect, selected } = props;

    return (
        <div className="list-group">
            {states.map((state, index) => (
                <SampleStatusesListItem
                    key={state.rowId}
                    state={state}
                    index={index}
                    active={index === selected}
                    onSelect={onSelect}
                />
            ))}
            {states.length === 0 && <p className="choices-list__empty-message">No sample statuses defined.</p>}
        </div>
    );
});
SampleStatusesList.displayName = 'SampleStatusesList';

interface ManageSampleStatusesPanelProps {
    api?: ComponentsAPIWrapper;
    titleCls?: string;
}

export const ManageSampleStatusesPanel: FC<ManageSampleStatusesPanelProps> = memo(props => {
    const { api, titleCls } = props;
    const [states, setStates] = useState<SampleState[]>();
    const [error, setError] = useState<string>();
    const [selected, setSelected] = useState<number>();
    const addNew = useMemo(() => selected === NEW_STATUS_INDEX, [selected]);

    const querySampleStatuses = useCallback(
        (newStatusLabel?: string) => {
            setError(undefined);

            api.samples
                .getSampleStatuses()
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

    const onActionComplete = useCallback(
        (newStatusLabel?: string, isDelete = false) => {
            querySampleStatuses(newStatusLabel);
            if (isDelete) setSelected(undefined);
        },
        [querySampleStatuses]
    );

    return (
        <div className="panel panel-default">
            {!titleCls && <div className="panel-heading">{TITLE}</div>}
            <div className="panel-body">
                {titleCls && <h4 className={titleCls}>{TITLE}</h4>}
                {error && <Alert>{error}</Alert>}
                {!states && <LoadingSpinner />}
                {states && !error && (
                    <div className="row choices-container">
                        <div className="col-lg-4 col-md-6">
                            <SampleStatusesList states={states} selected={selected} onSelect={onSetSelected} />
                            <AddEntityButton onClick={onAddState} entity="New Status" disabled={addNew} />
                        </div>
                        <div className="col-lg-8 col-md-6">
                            <SampleStatusDetail
                                // use null to indicate that no statuses exist to be selected, so don't show the empty message
                                state={states.length === 0 ? null : states[selected]}
                                addNew={addNew}
                                onActionComplete={onActionComplete}
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
