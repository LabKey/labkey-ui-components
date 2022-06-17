import React, { FC, memo, useCallback, useState } from 'react';
import { Col, Modal, OverlayTrigger, Popover, Row } from 'react-bootstrap';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import classNames from 'classnames';

import { Alert } from '../../internal/components/base/Alert';
import { saveAsSessionView } from '../../internal/actions';
import { getQueryDetails } from '../../internal/query/api';
import { APP_FIELD_CANNOT_BE_REMOVED_MESSAGE } from '../../internal/constants';
import { DragDropHandle } from '../../internal/components/base/DragDropHandle';
import { QueryModel } from './QueryModel';
import { QueryColumn } from '../QueryColumn';
import { QueryInfo } from '../QueryInfo';

interface FieldLabelDisplayProps {
    column: QueryColumn;
    includeFieldKey?: boolean;
}

// exported for jest testing
export const FieldLabelDisplay: FC<FieldLabelDisplayProps> = memo(props => {
    const { column, includeFieldKey } = props;
    const id = column.index + '-fieldlabel-popover';
    const content = <div className="field-name">{column.caption ?? column.name}</div>;

    // only show hover tooltip for lookup child fields
    if (!includeFieldKey || column.index.indexOf('/') === -1) return content;

    return (
        <OverlayTrigger
            overlay={
                <Popover id={id} key={id}>
                    {column.index}
                </Popover>
            }
            placement="left"
        >
            {content}
        </OverlayTrigger>
    );
});

interface ColumnChoiceProps {
    column: QueryColumn;
    isExpanded?: boolean;
    isInView?: boolean;
    onAddColumn: (column: QueryColumn) => void;
    onCollapseColumn: (column: QueryColumn) => void;
    onExpandColumn: (column: QueryColumn) => void;
}

// exported for jest tests
export const ColumnChoice: FC<ColumnChoiceProps> = memo(props => {
    const { column, isExpanded, isInView, onAddColumn, onExpandColumn, onCollapseColumn } = props;
    const colFieldKey = column.index;
    const hasParentFieldKeys = colFieldKey.indexOf('/') > -1;
    const parentFieldKeys = hasParentFieldKeys ? colFieldKey.substring(0, colFieldKey.lastIndexOf('/')).split('/') : [];

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
        <div className="list-group-item flex" key={colFieldKey}>
            {parentFieldKeys.map((parent, index) => (
                <div className="field-expand-icon" key={colFieldKey + '|' + index} />
            ))}
            <div className="field-expand-icon">
                {column.isLookup() && !isExpanded && <i className="fa fa-plus-square" onClick={_onExpandColumn} />}
                {column.isLookup() && isExpanded && <i className="fa fa-minus-square" onClick={_onCollapseColumn} />}
            </div>
            <FieldLabelDisplay column={column} />
            {isInView && (
                <div className="pull-right" title="This field is included in the view.">
                    <i className="fa fa-check" />
                </div>
            )}
            {!isInView && column.selectable && (
                <div className="pull-right clickable" title="Add this field to the view." onClick={_onAddColumn}>
                    <i className="fa fa-plus" />
                </div>
            )}
        </div>
    );
});

interface ColumnChoiceLookupProps extends ColumnChoiceProps {
    columnsInView: any;
    expandedColumns: Record<string, QueryInfo>;
    showAllColumns: boolean;
}

// exported for jest tests
export const ColumnChoiceGroup: FC<ColumnChoiceLookupProps> = memo(props => {
    const { expandedColumns, column, onAddColumn, onExpandColumn, onCollapseColumn, columnsInView, showAllColumns } =
        props;
    const isLookupExpanded = !!expandedColumns[column.index];

    const isColumnInView = (column: QueryColumn): boolean => {
        return columnsInView.findIndex(col => col.index === column.index) !== -1;
    };

    const parentElement = (
        <ColumnChoice
            column={column}
            key={column.index}
            isInView={isColumnInView(column)}
            onAddColumn={onAddColumn}
            isExpanded={isLookupExpanded}
            onExpandColumn={onExpandColumn}
            onCollapseColumn={onCollapseColumn}
        />
    );

    let childElements = [];
    if (isLookupExpanded) {
        childElements = expandedColumns[column.index].columns
            .valueSeq()
            .filter(fkCol => (showAllColumns || !fkCol.hidden) && !fkCol.removeFromViews)
            .map(fkCol => (
                <ColumnChoiceGroup
                    column={fkCol}
                    key={fkCol.index}
                    isInView={isColumnInView(fkCol)}
                    onAddColumn={onAddColumn}
                    isExpanded={!!expandedColumns[fkCol.index]}
                    onExpandColumn={onExpandColumn}
                    onCollapseColumn={onCollapseColumn}
                    expandedColumns={expandedColumns}
                    columnsInView={columnsInView}
                    showAllColumns={showAllColumns}
                />
            ))
            .toArray();
    }

    return (
        <>
            {parentElement}
            {childElements}
        </>
    );
});

interface ColumnInViewProps {
    column: QueryColumn;
    index: number;
    onClick: (index: number) => void;
    onRemoveColumn: (column: QueryColumn) => void;
    selected: boolean;
}

// exported for jest tests
export const ColumnInView: FC<ColumnInViewProps> = memo(props => {
    const { column, onRemoveColumn, onClick, selected, index } = props;
    const key = column.index;

    const _onRemoveColumn = useCallback(() => {
        onRemoveColumn(column);
    }, [column, onRemoveColumn]);

    const _onClick = useCallback(() => {
        onClick(index);
    }, [onClick, index]);

    let overlay;
    const cannotBeRemoved = column.addToDisplayView === true;
    const content = (
        <span
            className={'pull-right ' + (cannotBeRemoved ? 'text-muted disabled' : 'clickable')}
            onClick={cannotBeRemoved ? undefined : _onRemoveColumn}
        >
            <i className="fa fa-times" />
        </span>
    );
    if (cannotBeRemoved) {
        overlay = (
            <Popover id={key + '-disabled-popover'} key={key + '-disabled-warning'}>
                {APP_FIELD_CANNOT_BE_REMOVED_MESSAGE}
            </Popover>
        );
    }
    return (
        <Draggable key={key} draggableId={key} index={index}>
            {(dragProvided, snapshot) => (
                <div className={classNames("list-group-item flex draggable", {"active": selected})}
                     onClick={_onClick}
                     ref={dragProvided.innerRef}
                     {...dragProvided.draggableProps}>
                    <div className="right-spacing" {...dragProvided.dragHandleProps}>
                        <DragDropHandle highlighted={snapshot.isDragging} {...dragProvided.dragHandleProps}/>
                    </div>
                    <FieldLabelDisplay column={column} includeFieldKey />
                    {!cannotBeRemoved && content}
                    {cannotBeRemoved &&
                        <OverlayTrigger overlay={overlay} placement="left">
                            {content}
                        </OverlayTrigger>
                    }
                </div>
            )}
        </Draggable>
    );
});

interface Props {
    model: QueryModel;
    onCancel: () => void;
    onUpdate: () => void;
    selectedColumn?: QueryColumn;
}

export const CustomizeGridViewModal: FC<Props> = memo(props => {
    const { model, onCancel, onUpdate, selectedColumn } = props;
    const { schemaQuery, title, queryInfo } = model;
    const [columnsInView, setColumnsInView] = useState<any>(model.displayColumns);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string>(undefined);
    const [queryDetailError, setQueryDetailError] = useState<string>(undefined);
    const [showAllColumns, setShowAllColumns] = useState<boolean>(false);
    const [expandedColumns, setExpandedColumns] = useState<Record<string, QueryInfo>>({});
    const [selectedIndex, setSelectedIndex] = useState<number>(selectedColumn ? model.displayColumns.findIndex(col => selectedColumn.index === col.index) : undefined);

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
        setSelectedIndex(undefined);
    }, [model]);

    const removeColumn = useCallback((removedColumn: QueryColumn) => {
        setColumnsInView(columnsInView.filter(column => column.index !== removedColumn.index));
        setIsDirty(true);
    }, [columnsInView]);

    const addColumn = useCallback((column: QueryColumn) => {
        if (selectedIndex !== undefined) {
            setColumnsInView([...columnsInView.slice(0, selectedIndex+1), column, ...columnsInView.slice(selectedIndex+1)]);
        } else {
            setColumnsInView([...columnsInView, column]);
        }
        setIsDirty(true);
    }, [selectedIndex, columnsInView]);

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

    const onDropField = useCallback((dropResult: DropResult): void => {
        const { destination, draggableId, source } = dropResult;
        if (destination === null || source.index === destination.index) {
            return;
        }
        const { index } = destination;

        const colInMotion = columnsInView[source.index];
        let updatedColumns = columnsInView.filter(col => col.index != draggableId);
        updatedColumns = [...updatedColumns.slice(0, index), colInMotion, ...updatedColumns.slice(index) ];
        setColumnsInView(updatedColumns);
        if (source.index === selectedIndex) {
            setSelectedIndex(index);
        } else if (selectedIndex !== undefined) {
            if (source.index > selectedIndex && index <= selectedIndex) {
                setSelectedIndex(selectedIndex + 1);
            } else if (source.index < selectedIndex && index >= selectedIndex) {
                setSelectedIndex(selectedIndex - 1);
            }
        }
        setIsDirty(true);
    }, [selectedIndex, columnsInView]);

    const onSelectField = useCallback((index: number): void => {
        setSelectedIndex(_selectedIndex => (_selectedIndex === index ? undefined : index));
    }, []);

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
                    <Col xs={12} sm={6} className="field-modal__col-2">
                        <div key="title" className="field-modal__col-title">
                            Available Fields
                        </div>
                        <div key="field-list" className="list-group field-modal__col-content">
                            {model.queryInfo.columns
                                .valueSeq()
                                .filter(
                                    column =>
                                        (showAllColumns || !column.hidden) &&
                                        !column.removeFromViews &&
                                        column.index.indexOf('/') === -1 // here at the top level we don't want to include lookup fields
                                )
                                .map(column => (
                                    <ColumnChoiceGroup
                                        column={column}
                                        key={column.index}
                                        onAddColumn={addColumn}
                                        onExpandColumn={expandColumn}
                                        onCollapseColumn={collapseColumn}
                                        expandedColumns={expandedColumns}
                                        columnsInView={columnsInView}
                                        showAllColumns={showAllColumns}
                                    />
                                ))}
                        </div>
                        <div key="toggleAll" className="field-modal__footer">
                            <input type="checkbox" checked={showAllColumns} onChange={toggleShowAll} />
                            &nbsp;Show all system and user-defined fields
                        </div>
                    </Col>
                    <Col xs={12} sm={6} className="field-modal__col-2">
                        <div className="field-modal__col-title">
                            <span>Shown in Grid</span>
                            <span className={"pull-right " + (isDirty ? "action-text" : "disabled-action-text")} onClick={isDirty ? revertEdits : undefined} >Undo edits</span>
                        </div>
                        <DragDropContext onDragEnd={onDropField} >
                            <Droppable droppableId="field-droppable">
                                {dropProvided => (
                                    <div className="list-group field-modal__col-content" {...dropProvided.droppableProps} ref={dropProvided.innerRef}>
                                        {columnsInView.map((column, index) => {
                                            return (
                                                <ColumnInView
                                                    key={column.index}
                                                    column={column}
                                                    index={index}
                                                    onRemoveColumn={removeColumn}
                                                    selected={selectedIndex === index}
                                                    onClick={onSelectField}
                                                />
                                            );
                                        })}
                                        {dropProvided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
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
