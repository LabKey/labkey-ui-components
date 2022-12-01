import React, { PureComponent } from 'react';

import { List, Map } from 'immutable';

import { FormControl, Modal } from 'react-bootstrap';

import { SchemaQuery } from '../public/SchemaQuery';
import { cancelEvent } from '../internal/events';

import { Grid } from '../internal/components/base/Grid';
import { QuerySelect } from '../internal/components/forms/QuerySelect';
import { Alert } from '../internal/components/base/Alert';
import { WizardNavButtons } from '../internal/components/buttons/WizardNavButtons';

const QC_STATE_SCHEMA_QUERY = SchemaQuery.create('core', 'qcstate');

export interface AssayQCState extends Record<string, any> {
    comment: string;
    state: string;
}

interface Props {
    assayContainer: string;
    cancel: () => void;
    error?: string;
    loading: boolean;
    requireComment?: boolean;
    // runs are the complete list of selected run ids, comes from QueryGridModel.selectedIds.
    runs: string[];
    save: (formState: AssayQCState) => void;
    // visibleRuns are the runs that are currently visible on the grid, comes from QueryGridModel.data
    visibleRuns: List<Map<string, any>>;
}

export class AssayQCModal extends PureComponent<Props, AssayQCState> {
    columns = List([
        {
            index: 'Name',
            title: 'Name',
        },
        {
            index: 'QCFlags',
            title: 'Current State',
        },
    ]);

    constructor(props: Props) {
        super(props);
        let state;

        if (props.runs?.length === 1) {
            // Grab the QCFlags value out of the first and only visible run. If the user has only one selected run it
            // is pretty likely it's also the only visible run.
            state = props.visibleRuns?.getIn(['0', 'QCFlags', 'value']);
        }

        this.state = {
            state,
            comment: '',
        };
    }

    updateField = (fieldName, value): void => {
        // Using "as AssayQCFormState" here seems less than ideal. Is there a better way to dynamically access
        // interface properties like this in TypeScript?
        this.setState({ [fieldName]: value });
    };

    // FormEvent<any> because TypeScript is convinced that React.FormEvent<FormControl> does not have
    // currentTarget.value, which is simply not true.
    updateComment = (event: React.FormEvent<any>): void => {
        cancelEvent(event);
        const value = event.currentTarget.value;
        this.updateField('comment', value);
    };

    save = (): void => {
        this.props.save({ ...this.state });
    };

    render() {
        const { assayContainer, cancel, error, loading, requireComment, visibleRuns } = this.props;
        const { comment, state } = this.state;
        const stateValid = state !== undefined && state !== '';
        const commentValid = !requireComment || (comment !== undefined && comment.trim() !== '');
        const saveEnabled = stateValid && commentValid && !loading;

        return (
            <Modal bsSize="large" onHide={cancel} show>
                <Modal.Header>
                    <Modal.Title>Update QC State</Modal.Title>
                </Modal.Header>

                <Modal.Body className="assay-qc-form">
                    <Grid striped={false} bordered={false} data={visibleRuns} columns={this.columns} />

                    <form>
                        <QuerySelect
                            containerPath={assayContainer}
                            label="QC State"
                            name="state"
                            required={true}
                            schemaQuery={QC_STATE_SCHEMA_QUERY}
                            onQSChange={this.updateField}
                            value={state}
                        />

                        <div className="form-group row">
                            <label className="control-label col-sm-3 text-left">Comment{requireComment && ' *'}</label>

                            <div className="col-sm-9">
                                <FormControl componentClass="textarea" value={comment} onChange={this.updateComment} />
                            </div>
                        </div>

                        {!!error && (
                            <div className="form-group no-margin-bottom clearfix">
                                <Alert bsStyle="danger">{error}</Alert>
                            </div>
                        )}
                    </form>
                </Modal.Body>

                <Modal.Footer>
                    <WizardNavButtons
                        cancel={cancel}
                        nextStep={this.save}
                        isFinishing={loading}
                        isFinishingText="Saving..."
                        canFinish={saveEnabled}
                        finish={true}
                        finishText="Save changes"
                    />
                </Modal.Footer>
            </Modal>
        );
    }
}
