import React, { FC, memo, useCallback, useState } from 'react';
import { Col, Modal, Row } from 'react-bootstrap';
import { Alert } from '../../internal/components/base/Alert';
import { saveAsSessionView } from '../../internal/actions';
import { QueryModel } from './QueryModel';
import { ChoicesListItem } from '../../internal/components/base/ChoicesListItem';

interface Props {
    model: QueryModel;
    title?: string;
    onCancel: () => void;
}

export const CustomizeGridViewModal: FC<Props> = memo(props => {
    const { title, model, onCancel } = props;
    const { schemaQuery } = model;
    const [visibleColumns, setVisibleColumns] = useState<any>(model.displayColumns);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string>(undefined);

    const gridName = title ?? schemaQuery.queryName;

    const closeModal = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const onSave = useCallback(async () => {
        try {
            await saveAsSessionView(schemaQuery, visibleColumns, model.containerPath, model.viewName, false);
            closeModal();
        } catch (error) {
            setSaveError(error);
        }
    }, [schemaQuery, visibleColumns]);

    const revertEdits = useCallback(() => {
        setVisibleColumns(model.displayColumns);
        setIsDirty(false);
    }, [model]);

    return (
        <Modal show bsSize="lg" onHide={closeModal}>
            <Modal.Header closeButton>
                <Modal.Title>Customize {gridName} Grid{model.viewName && ' - ' + model.viewName}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert>{saveError}</Alert>
                <Row className="field-modal__container">
                    <Col xs={6} className="field-modal__col2">
                        <div className="field-modal__col-title">All Fields</div>
                        <div className="list-group field-modal__col-content">
                            Coming soon
                        </div>
                    </Col>
                    <Col xs={6} className="field-modal__col2">
                        <div className="field-modal__col-title">
                            <span>Shown in Grid</span>
                            <span className="pull-right action-text" onClick={revertEdits}>Restore default columns</span>
                        </div>
                        <div className="list-group filter-modal__col-content">
                            Coming soon
                        </div>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <div className="pull-left">
                    <button type="button" className="btn btn-default" onClick={closeModal}>
                        Cancel
                    </button>
                </div>
                <div className="pull-right">
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={onSave}
                        disabled={!isDirty}
                    >
                        Update Grid
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    )
})
