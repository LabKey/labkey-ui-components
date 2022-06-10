import React, { FC, memo, useCallback, useState } from 'react';
import { Col, Modal, OverlayTrigger, Popover, Row } from 'react-bootstrap';
import { Alert } from '../../internal/components/base/Alert';
import { saveAsSessionView } from '../../internal/actions';
import { QueryModel } from './QueryModel';
import { QueryColumn } from '../QueryColumn';
import { APP_COLUMN_CANNOT_BE_REMOVED_MESSAGE } from '../../internal/renderers';

interface Props {
    model: QueryModel;
    onCancel: () => void;
    onUpdate: () => void;
}

export const CustomizeGridViewModal: FC<Props> = memo(props => {
    const { model, onCancel, onUpdate } = props;
    const { schemaQuery, title } = model;
    const [columnsInView, setColumnsInView] = useState<any>(model.displayColumns);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string>(undefined);
    const [showAllColumns, setShowAllColumns] = useState<boolean>(false);

    const gridName = title ?? schemaQuery.queryName;

    const closeModal = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const _onUpdate = useCallback(async () => {
        try {
            await saveAsSessionView(schemaQuery, columnsInView, model.containerPath, model.viewName, false);
            closeModal();
            onUpdate();
        } catch (error) {
            setSaveError(error);
        }
    }, [schemaQuery, columnsInView]);

    const revertEdits = useCallback(() => {
        setColumnsInView(model.displayColumns);
        setIsDirty(false);
    }, [model]);

    const removeColumn = useCallback((deleteIndex: number) => {
        setColumnsInView(columnsInView.filter((column, index) => index !== deleteIndex));
        setIsDirty(true);
    }, [columnsInView]);

    const addColumn = useCallback((column: QueryColumn) => {
        setColumnsInView([...columnsInView, column]);
        setIsDirty(true);
    }, [columnsInView]);

    const toggleShowAll = useCallback(() => {
        setShowAllColumns(!showAllColumns);
    }, [showAllColumns]);

    const isColumnInView = (column: QueryColumn) => {
        return columnsInView.findIndex(col => col === column) !== -1;
    }

    return (
        <Modal show bsSize="lg" onHide={closeModal}>
            <Modal.Header closeButton>
                <Modal.Title>Customize {gridName} Grid{model.viewName && ' - ' + model.viewName}{model.currentView.session && <span className="alert-info view-edit-alert view-edit-title-alert">Edited</span>}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert>{saveError}</Alert>
                <Row className="field-modal__container">
                    <Col xs={6} className="field-modal__col-2">
                        <div className="field-modal__col-title">All Fields</div>
                        <div className="list-group field-modal__col-content">
                            {
                                model.allColumns.filter(column => isColumnInView(column) || ((showAllColumns || !column.hidden) && !column.removeFromViews)).map((column, index) => {
                                    const isInView = isColumnInView(column);
                                    return (
                                        <div className="list-group-item" key={index}>
                                            <span className="field-name">{column.caption}</span>
                                            {isInView && <span className="pull-right" ><i className="fa fa-check"/></span>}
                                            {!isInView && <span className="pull-right clickable" onClick={() => addColumn(column)}><i className="fa fa-plus"/></span>}
                                        </div>
                                    );
                                })
                            }
                        </div>
                        <div>
                            <input type="checkbox" checked={showAllColumns} onClick={toggleShowAll}/>&nbsp;Show all system and user-defined fields
                        </div>
                    </Col>
                    <Col xs={6} className="field-modal__col-2">
                        <div className="field-modal__col-title">
                            <span>Shown in Grid</span>
                            {/* Taking this out for now, until we figure out how to handle session views here */}
                            {/*{!model.currentView.session && isDirty && <span className="pull-right action-text" onClick={revertEdits}>Restore default columns</span>}*/}
                        </div>
                        <div className="list-group field-modal__col-content">
                            {
                                columnsInView.map((column, index) => {
                                    let overlay;
                                    const disabled = column.addToDisplayView;
                                    let content = (
                                        <span className={"pull-right " + (disabled ? "text-muted disabled" : "clickable")} onClick={disabled ? undefined : () => removeColumn(index)}>
                                            <i className="fa fa-times"/>
                                        </span>
                                    );
                                    if (disabled) {
                                        overlay = <Popover key={index + '-disabled-warning'}>{APP_COLUMN_CANNOT_BE_REMOVED_MESSAGE}</Popover>;
                                    }
                                    return (
                                        <div className="list-group-item" key={index}>
                                            <span className={"field-name" + (disabled ? " text-muted" : "")} >{column.caption}</span>
                                            {!disabled && content}
                                            {disabled &&
                                                <OverlayTrigger overlay={overlay} placement="bottom">
                                                    {content}
                                                </OverlayTrigger>
                                            }
                                        </div>
                                    );
                                })
                            }
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
                        onClick={_onUpdate}
                        disabled={!isDirty}
                    >
                        Update Grid
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    )
})
