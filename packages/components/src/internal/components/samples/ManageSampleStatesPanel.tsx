import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { FormGroup } from 'react-bootstrap';
import classNames from 'classnames';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { Alert } from '../base/Alert';
import { LockIcon } from '../base/LockIcon';

import { SampleState } from './actions';
import { AddEntityButton } from '../buttons/AddEntityButton';
import { DomainFieldLabel } from '../domainproperties/DomainFieldLabel';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { SelectInput } from '../forms/input/SelectInput';
import { selectRows } from '../../query/api';
import { caseInsensitive } from '../../util/utils';

const TITLE = 'Manage Sample Statuses';
const STATE_TYPE_SQ = SchemaQuery.create('exp', 'SampleStateType');
const DEFAULT_TYPE_OPTIONS = [{ value: 'Available' }, { value: 'Consumed' }, { value: 'Locked' }];
const NEW_STATUS_INDEX = -1;

interface Props {
    api?: ComponentsAPIWrapper;
    titleCls?: string;
}

export const ManageSampleStatesPanel: FC<Props> = memo(props => {
    const { api, titleCls } = props;
    const [states, setStates] = useState<SampleState[]>();
    const [error, setError] = useState<string>();
    const [selected, setSelected] = useState<number>();
    const addNew = useMemo(() => selected === NEW_STATUS_INDEX, [selected]);

    useEffect(() => {
        api.samples
            .getSampleStates()
            .then(setStates)
            .catch(() => {
                setStates([]);
                setError('Error: Unable to load sample states.');
            });
    }, [api]);

    const onSetSelected = useCallback((index: number) => {
        setSelected(index);
    }, []);

    const onAddState = useCallback(() => {
        setSelected(NEW_STATUS_INDEX);
    }, []);

    return (
        <div className="panel panel-default">
            {!titleCls && <div className="panel-heading">{TITLE}</div>}
            <div className="panel-body">
                {titleCls && <h4 className={titleCls}>{TITLE}</h4>}
                {error && <Alert>{error}</Alert>}
                {!states && <LoadingSpinner />}
                {states && (
                    <div className="row choices-container">
                        <div className="col-lg-4 col-md-6">
                            <SampleStatesList states={states} selected={selected} onSelect={onSetSelected} />
                            <AddEntityButton onClick={onAddState} entity="New Status" disabled={addNew} />
                        </div>
                        <div className="col-lg-8 col-md-6">
                            <SampleStateDetail state={states[selected]} addNew={addNew} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

ManageSampleStatesPanel.defaultProps = {
    api: getDefaultAPIWrapper(),
};

ManageSampleStatesPanel.displayName = 'ManageSampleStatesPanel';

interface SampleStatesListProps {
    onSelect: (index: number) => void;
    selected: number;
    states: SampleState[];
}

const SampleStatesList: FC<SampleStatesListProps> = memo(props => {
    const { states, onSelect, selected } = props;

    return (
        <div className="list-group">
            {states.map((state, index) => <SampleStatesListItem state={state} index={index} active={index === selected} onSelect={onSelect} />)}
            {states.length === 0 && <p className="choices-list__empty-message">No sample states defined.</p>}
        </div>
    );
});
SampleStatesList.displayName = 'SampleStatesList';

interface SampleStatesListItemProps {
    active?: boolean;
    index: number;
    onSelect: (index: number) => void;
    state: SampleState;
}

const SampleStatesListItem: FC<SampleStatesListItemProps> = memo(props => {
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
                    iconCls="pull-right"
                    body={
                        <p>This sample state is in-use so its type cannot be changed and it cannot be removed.</p>
                    }
                    id="sample-state-lock-icon"
                    title="Sample State Locked"
                />
            )}
        </button>
    );
});
SampleStatesList.displayName = 'SampleStatesList';

interface SampleStateDetailProps {
    addNew: boolean;
    state: SampleState;
}

const SampleStateDetail: FC<SampleStateDetailProps> = memo(props => {
    const { state, addNew } = props;
    const [typeOptions, setTypeOptions] = useState<Record<string, any>[]>();
    const [updatedState, setUpdatedState] = useState<SampleState>();

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
            .catch(error => {
                console.error(error);
                setTypeOptions(DEFAULT_TYPE_OPTIONS);
            });
    }, []);

    useEffect(() => {
        if (state) setUpdatedState(state);
        if (addNew) setUpdatedState(new SampleState({ stateType: typeOptions?.[0]?.value }))
    }, [state, addNew]);

    const onFormChange = useCallback((evt): void => {
        const {name, value} = evt.target;
        setUpdatedState(updatedState.set(name, value));
    }, [updatedState]);

    const onSelectChange = useCallback((name, value): void => {
        setUpdatedState(updatedState.set(name, value));
    }, [updatedState]);

    return (
        <>
            {!updatedState && <p className="choices-detail__empty-message">Select a sample status to view details.</p>}
            {updatedState && (
                <form className="form-horizontal content-form">
                    <FormGroup>
                        <div className="col-sm-4">
                            <DomainFieldLabel label="Label" required />
                        </div>
                        <div className="col-sm-8">
                            <input
                                className="form-control"
                                name="label"
                                onChange={onFormChange}
                                placeholder="Enter status label"
                                // ref={nameRef}
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
                                disabled={updatedState.inUse}
                                options={typeOptions}
                                value={updatedState.stateType}
                            />
                        </div>
                    </FormGroup>
                </form>
            )}
        </>
    );
});
SampleStateDetail.displayName = 'SampleStateDetail';
