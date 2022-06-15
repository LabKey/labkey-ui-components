import React, { FC, memo, useCallback, useState } from 'react';
import { Col, Modal, OverlayTrigger, Popover, Row } from 'react-bootstrap';

import { Alert } from '../../internal/components/base/Alert';
import { saveAsSessionView } from '../../internal/actions';
import { getQueryDetails } from '../../internal/query/api';
import { APP_FIELD_CANNOT_BE_REMOVED_MESSAGE } from '../../internal/renderers';
import { QueryModel } from './QueryModel';
import { QueryColumn } from '../QueryColumn';
import { QueryInfo } from '../QueryInfo';

interface FieldLabelDisplayProps {
    column: QueryColumn;
}

const FieldLabelDisplay: FC<FieldLabelDisplayProps> = memo(props => {
    const { column } = props;
    const id = column.index + '-fieldlabel-popover';

    const overlay = (
        <Popover id={id} key={id}>
            Field Key: {column.index}
        </Popover>
    );

    return (
        <OverlayTrigger overlay={overlay} placement="right">
            <span className="field-name">{column.caption ?? column.name}</span>
        </OverlayTrigger>
    );
});

interface ColumnChoiceProps {
    column: QueryColumn;
    isExpanded: boolean;
    isInView: boolean;
    onAddColumn: (column: QueryColumn) => void;
    onCollapseColumn: (column: QueryColumn) => void;
    onExpandColumn: (column: QueryColumn) => void;
}

// exported for jest tests
export const ColumnChoice: FC<ColumnChoiceProps> = memo(props => {
    const { column, isExpanded, isInView, onAddColumn, onExpandColumn, onCollapseColumn } = props;
    const colFK = column.index;
    const idPopover = colFK + '-unselectable-popover';
    const hasParentFKs = colFK.indexOf('/') > -1;
    const parentFKs = hasParentFKs ? colFK.substring(0, colFK.lastIndexOf('/')).split('/') : [];

    const _onAddColumn = useCallback(() => {
        onAddColumn(column);
    }, [column, onAddColumn]);

    const _onExpandColumn = useCallback(() => {
        onExpandColumn(column);
    }, [column, onExpandColumn]);

    const _onCollapseColumn = useCallback(() => {
        onCollapseColumn(column);
    }, [column, onCollapseColumn]);

    return (
        <div className="list-group-item" key={colFK}>
            {parentFKs.map((parent, index) => (
                <span className="field-expand-icon" key={colFK + '|' + index} />
            ))}
            <span className="field-expand-icon">
                {column.isLookup() && !isExpanded && <i className="fa fa-plus-square" onClick={_onExpandColumn} />}
                {column.isLookup() && isExpanded && <i className="fa fa-minus-square" onClick={_onCollapseColumn} />}
            </span>
            <FieldLabelDisplay column={column} />
            {isInView && (
                <span className="pull-right" title="This field is included in the view.">
                    <i className="fa fa-check" />
                </span>
            )}
            {!isInView && column.selectable && (
                <span className="pull-right clickable" title="Add this field to the view." onClick={_onAddColumn}>
                    <i className="fa fa-plus" />
                </span>
            )}
            {!isInView && !column.selectable && (
                <OverlayTrigger
                    overlay={
                        <Popover id={idPopover} key={idPopover}>
                            This field cannot be added.
                        </Popover>
                    }
                    placement="left"
                >
                    <span className="pull-right text-muted disabled">
                        <i className="fa fa-plus" />
                    </span>
                </OverlayTrigger>
            )}
        </div>
    );
});

interface ColumnInViewProps {
    column: QueryColumn;
    onRemoveColumn: (column: QueryColumn) => void;
}

// exported for jest tests
export const ColumnInView: FC<ColumnInViewProps> = memo(props => {
    const { column, onRemoveColumn } = props;

    const _onRemoveColumn = useCallback(() => {
        onRemoveColumn(column);
    }, [column, onRemoveColumn]);

    let overlay;
    const disabled = column.addToDisplayView;
    const content = (
        <span
            className={'pull-right ' + (disabled ? 'text-muted disabled' : 'clickable')}
            onClick={disabled ? undefined : _onRemoveColumn}
        >
            <i className="fa fa-times" />
        </span>
    );
    if (disabled) {
        overlay = (
            <Popover id={column.index + '-disabled-popover'} key={column.index + '-disabled-warning'}>
                {APP_FIELD_CANNOT_BE_REMOVED_MESSAGE}
            </Popover>
        );
    }
    return (
        <div className="list-group-item" key={column.index}>
            <FieldLabelDisplay column={column} />
            {!disabled && content}
            {disabled && (
                <OverlayTrigger overlay={overlay} placement="left">
                    {content}
                </OverlayTrigger>
            )}
        </div>
    );
});

interface Props {
    model: QueryModel;
    onCancel: () => void;
    onUpdate: () => void;
}

export const CustomizeGridViewModal: FC<Props> = memo(props => {
    const { model, onCancel, onUpdate } = props;
    const { schemaQuery, title, queryInfo } = model;
    const [columnsInView, setColumnsInView] = useState<any>(model.displayColumns);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string>(undefined);
    const [queryDetailError, setQueryDetailError] = useState<string>(undefined);
    const [showAllColumns, setShowAllColumns] = useState<boolean>(false);
    const [expandedColumns, setExpandedColumns] = useState<Record<string, QueryInfo>>({});

    const gridName = title ?? schemaQuery.queryName;

    const closeModal = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const _onUpdate = useCallback(async () => {
        try {
            const viewInfo = model.currentView.mutate({
                columns: columnsInView.map(col => ({ fieldKey: col.index })),
            });
            await saveAsSessionView(schemaQuery, model.containerPath, viewInfo);
            closeModal();
            onUpdate();
        } catch (error) {
            setSaveError(error);
        }
    }, [closeModal, onUpdate, model, schemaQuery, columnsInView]);

    const revertEdits = useCallback(() => {
        setColumnsInView(model.displayColumns);
        setIsDirty(false);
    }, [model]);

    const removeColumn = useCallback((removedColumn: QueryColumn) => {
        setColumnsInView(columnsInView.filter(column => column !== removedColumn));
        setIsDirty(true);
    }, [columnsInView]);

    const addColumn = useCallback((column: QueryColumn) => {
        setColumnsInView([...columnsInView, column]);
        setIsDirty(true);
    }, [columnsInView]);

    const expandColumn = useCallback(async (column: QueryColumn) => {
        try {
            setQueryDetailError(undefined);
            const fkQueryInfo = await getQueryDetails({
                schemaName: queryInfo.schemaQuery.schemaName,
                queryName: queryInfo.schemaQuery.queryName,
                fk: column.index,
            });
            setExpandedColumns({ ...expandedColumns, [column.index]: fkQueryInfo });
        } catch (error) {
            setQueryDetailError(error.message);
        }
    }, [queryInfo, expandedColumns]);

    const collapseColumn = useCallback((column: QueryColumn) => {
        setQueryDetailError(undefined);
        setExpandedColumns({ ...expandedColumns, [column.index]: undefined });
    }, [expandedColumns]);

    const toggleShowAll = useCallback(() => {
        setShowAllColumns(!showAllColumns);
    }, [showAllColumns]);

    const isColumnInView = (column: QueryColumn): boolean => {
        return columnsInView.findIndex(col => col.index === column.index) !== -1;
    };

    return (
        <Modal show bsSize="lg" onHide={closeModal}>
            <Modal.Header closeButton>
                <Modal.Title>
                    Customize {gridName} Grid{model.viewName && ' - ' + model.viewName}
                    {model.currentView.session && (
                        <span className="alert-info view-edit-alert view-edit-title-alert">Edited</span>
                    )}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert>{queryDetailError}</Alert>
                <Alert>{saveError}</Alert>
                <Row className="field-modal__container">
                    <Col xs={6} className="field-modal__col-2">
                        <div key="title" className="field-modal__col-title">
                            Available Fields
                        </div>
                        <div key="field-list" className="list-group field-modal__col-content">
                            {model.queryInfo.columns
                                .valueSeq()
                                .filter(
                                    column =>
                                        isColumnInView(column) ||
                                        ((showAllColumns || !column.hidden) && !column.removeFromViews)
                                )
                                .map(column => {
                                    const isLookupExpanded = !!expandedColumns[column.index];
                                    let content = [
                                        <ColumnChoice
                                            column={column}
                                            key={column.index}
                                            isInView={isColumnInView(column)}
                                            onAddColumn={addColumn}
                                            isExpanded={isLookupExpanded}
                                            onExpandColumn={expandColumn}
                                            onCollapseColumn={collapseColumn}
                                        />,
                                    ];

                                    if (isLookupExpanded) {
                                        content = content.concat(
                                            expandedColumns[column.index].columns
                                                .valueSeq()
                                                .filter(
                                                    fkCol => (showAllColumns || !fkCol.hidden) && !fkCol.removeFromViews
                                                )
                                                .map(fkCol => (
                                                    <ColumnChoice
                                                        column={fkCol}
                                                        key={fkCol.index}
                                                        isInView={isColumnInView(fkCol)}
                                                        onAddColumn={addColumn}
                                                        isExpanded={false}
                                                        onExpandColumn={expandColumn}
                                                        onCollapseColumn={collapseColumn}
                                                    />
                                                ))
                                                .toArray()
                                        );
                                    }

                                    return content;
                                })}
                        </div>
                        <div key="toggleAll">
                            <input type="checkbox" checked={showAllColumns} onChange={toggleShowAll} />
                            &nbsp;Show all system and user-defined fields
                        </div>
                    </Col>
                    <Col xs={6} className="field-modal__col-2">
                        <div className="field-modal__col-title">
                            <span>Shown in Grid</span>
                            {/* Taking this out for now, until we figure out how to handle session views here */}
                            {/* {!model.currentView.session && isDirty && <span className="pull-right action-text" onClick={revertEdits}>Restore default columns</span>} */}
                        </div>
                        <div className="list-group field-modal__col-content">
                            {columnsInView.map(column => (
                                <ColumnInView key={column.index} column={column} onRemoveColumn={removeColumn} />
                            ))}
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
                        disabled={!isDirty || columnsInView.length === 0}
                    >
                        Update Grid
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    );
});
