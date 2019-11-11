import * as React from 'react';
import { Modal } from "react-bootstrap";
import { QueryGridModel, WizardNavButtons } from '@glass/base';
import { AddRowsControlProps } from './Controls';
import { gridInit, schemaGridInvalidate } from '../../actions';
import { getQueryGridModel } from '../../global';
import { EditableGridPanel } from './EditableGridPanel';
import { EditableGridProps } from './EditableGrid';

interface Props extends EditableGridProps {
    show: boolean,
    title: string,
    onCancel?: () => void
    onSave: (model: QueryGridModel) => void
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
        this.init();
    }

    init() {
        gridInit(this.props.model, true, this)
    }

    onCancel = () => {
        schemaGridInvalidate(this.props.model.schema, true);
        if (this.props.onCancel) {
            this.props.onCancel();
        }
    };

    getQueryGridModel() {
        return getQueryGridModel(this.props.model.getId()) || this.props.model;
    }

    onSave = () => {
        this.props.onSave(this.getQueryGridModel());
        schemaGridInvalidate(this.props.model.schema, true);
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
                        allowRemove={this.props.allowRemove}
                        allowBulkRemove={false}
                        allowBulkUpdate={false}
                        bordered={this.props.bordered}
                        condensed={false}
                        striped={true}
                        model={this.getQueryGridModel()}
                        initialEmptyRowCount={0}
                        emptyGridMsg={'Start by adding the number of locations you want to create.'}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <WizardNavButtons
                        cancel={this.onCancel}
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