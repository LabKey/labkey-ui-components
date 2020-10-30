import React from 'react';
import { Modal } from 'react-bootstrap';

import { gridInit, schemaGridInvalidate } from '../../actions';
import { getQueryGridModel } from '../../global';

import { QueryGridModel, WizardNavButtons } from '../../..';

import { EditableGridPanel } from './EditableGridPanel';
import { EditableGridProps } from './EditableGrid';

import { AddRowsControlProps } from './Controls';

interface Props extends EditableGridProps {
    show: boolean;
    title: string;
    onCancel?: () => void;
    onSave: (model: QueryGridModel) => void;
    cancelText?: string;
    addControlProps?: Partial<AddRowsControlProps>;
    saveText?: string;
    savingText?: string;
    isSaving?: boolean;
}

export class EditableGridModal extends React.PureComponent<Props, any> {
    static defaultProps = {
        cancelText: 'Cancel',
        saveText: 'Save',
        savingText: 'Saving...',
        isSaving: false,
    };

    UNSAFE_componentWillMount(): void {
        this.init();
    }

    UNSAFE_componentWillReceiveProps(nextProps: Props): void {
        if (nextProps.show && !nextProps.isSaving) this.init();
    }

    componentWillUnmount() {
        schemaGridInvalidate(this.props.model.schema);
    }

    init() {
        gridInit(this.getQueryGridModel(), true, this);
    }

    onCancel = () => {
        if (this.props.onCancel) {
            this.props.onCancel();
        }
    };

    getQueryGridModel() {
        return getQueryGridModel(this.props.model.getId()) || this.props.model;
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
                        columnMetadata={this.props.columnMetadata}
                        notDeletable={this.props.notDeletable}
                        allowRemove={this.props.allowRemove}
                        allowBulkRemove={false}
                        allowBulkAdd={false}
                        bordered={this.props.bordered}
                        condensed={false}
                        striped={true}
                        model={this.getQueryGridModel()}
                        initialEmptyRowCount={0}
                        emptyGridMsg="Start by adding the number of locations you want to create."
                    />
                </Modal.Body>
                <Modal.Footer>
                    <WizardNavButtons
                        cancel={this.onCancel}
                        cancelText={this.props.cancelText}
                        containerClassName=""
                        finish={true}
                        finishText={this.props.saveText}
                        isFinishingText={this.props.savingText}
                        isFinishing={this.props.isSaving}
                        nextStep={this.onSave}
                    />
                </Modal.Footer>
            </Modal>
        );
    }
}
