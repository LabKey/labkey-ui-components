import * as React from 'react';
import { Modal } from "react-bootstrap";
import { QueryGridModel, SchemaQuery, WizardNavButtons } from '@glass/base';

import { EditableGridLoader } from './EditableGridLoader';
import { AddRowsControlProps } from './Controls';
import { gridInit } from '../../actions';
import { getQueryGridModel } from '../../global';
import { getStateQueryGridModel } from '../../models';
import { EditableGridPanel } from './EditableGridPanel';

interface Props {
    show: boolean,
    title: string,
    onCancel: (any) => void
    onSave: (model: QueryGridModel) => void
    schemaQuery: SchemaQuery
    cancelText?: string
    addControlProps?: Partial<AddRowsControlProps>
    saveText?: string
}

export class EditableGridModal extends React.PureComponent<Props, any> {

    static defaultProps = {
        cancelText: 'Cancel',
        saveText: 'Save'
    };

    componentWillMount() {
        this.init();
    }

    componentWillReceiveProps(nextProps: Props) {
        if (nextProps.schemaQuery !== this.props.schemaQuery) {
            this.init();
        }
    }

    init() {
        gridInit(this.getQueryGridModel())
    }

    getQueryGridModel() {
        const model = getStateQueryGridModel('lookup-management', this.props.schemaQuery, {
            loader: new EditableGridLoader(),
            editable: true
        });

        return getQueryGridModel(model.getId()) || model;
    }

    onSave = () => {
        this.props.onSave(this.getQueryGridModel());
    };

    render() {
        const { show, title, onCancel } = this.props;

        return (
            <Modal show={show} onHide={onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <EditableGridPanel
                        addControlProps={this.props.addControlProps}
                        allowBulkRemove={false}
                        allowBulkUpdate={false}
                        bordered={true}
                        condensed={false}
                        striped={true}
                        model={this.getQueryGridModel()}
                        initialEmptyRowCount={0}
                        emptyGridMsg={'Start by adding the number of locations you want to create.'}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <WizardNavButtons
                        cancel={this.props.onCancel}
                        cancelText={this.props.cancelText}
                        containerClassName=""
                        finish={true}
                        finishText={this.props.saveText}
                        nextStep={this.onSave}
                    />
                </Modal.Footer>
            </Modal>
        )
    }
}