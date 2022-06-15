import React, { FC, memo, useCallback, useState } from 'react';
import { Col, Modal, OverlayTrigger, Popover, Row } from 'react-bootstrap';
import { Alert } from '../../internal/components/base/Alert';
import { saveAsSessionView } from '../../internal/actions';
import { QueryModel } from './QueryModel';
import { QueryColumn } from '../QueryColumn';
import { APP_COLUMN_CANNOT_BE_REMOVED_MESSAGE } from '../../internal/renderers';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { DragDropHandle } from '../../internal/components/base/DragDropHandle';
import classNames from 'classnames';

interface ColumnChoiceProps {
    column: QueryColumn,
    index: number,
    isInView: boolean,
    onAddColumn: () => void,
}

// exported for jest tests
export const ColumnChoice: FC<ColumnChoiceProps> = memo(props => {
    const { column, index, isInView, onAddColumn } = props;

    return (
        <div className="list-group-item" key={index}>
            <span className="field-name">{column.caption ?? column.name}</span>
            {isInView && <span className="pull-right" title={"This field is included in the view."} ><i className="fa fa-check"/></span>}
            {!isInView && <span className="pull-right clickable" title={"Add this field to the view."} onClick={onAddColumn}><i className="fa fa-plus"/></span>}
        </div>
    );
});

interface ColumnInViewProps {
    column: QueryColumn,
    index: number
    onColumnRemove: () => void
    selected: boolean
    onClick: () => void
}

// exported for jest tests
export const ColumnInView: FC<ColumnInViewProps> = memo(props => {
    const { column, index, onClick, onColumnRemove, selected } = props;

    let overlay;
    const cannotBeRemoved = column.addToDisplayView === true;
    let content = (
        <span className={"pull-right " + (cannotBeRemoved ? "text-muted disabled" : "clickable")} onClick={cannotBeRemoved ? undefined : onColumnRemove}>
            <i className="fa fa-times"/>
        </span>
    );
    if (cannotBeRemoved) {
        overlay = <Popover id={column.name + "-disabled-popover"} key={index + '-disabled-warning'}>{APP_COLUMN_CANNOT_BE_REMOVED_MESSAGE}</Popover>;
    }
    const key = column.index;

    return (
        <Draggable key={key} draggableId={key} index={index} >
            {(dragProvided, snapshot) => (
                <div className={classNames("list-group-item", {"selected": selected})}
                     onClick={onClick}
                     ref={dragProvided.innerRef}
                     {...dragProvided.draggableProps}>
                    <span {...dragProvided.dragHandleProps}>
                        <DragDropHandle highlighted={snapshot.isDragging} {...dragProvided.dragHandleProps}/>
                    </span>
                    <span key={index}>
                        <span className="field-name left-spacing" >{column.caption ?? column.name}</span>
                        {!cannotBeRemoved && content}
                        {cannotBeRemoved &&
                            <OverlayTrigger overlay={overlay} placement="bottom">
                                {content}
                            </OverlayTrigger>
                        }
                    </span>
                </div>
            )}
        </Draggable>
    );
})

interface Props {
    model: QueryModel;
    onCancel: () => void;
    onUpdate: () => void;
    selectedColumn: QueryColumn;
}

export const CustomizeGridViewModal: FC<Props> = memo(props => {
    const { model, onCancel, onUpdate, selectedColumn } = props;
    const { schemaQuery, title } = model;
    const [columnsInView, setColumnsInView] = useState<any>(model.displayColumns);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string>(undefined);
    const [showAllColumns, setShowAllColumns] = useState<boolean>(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(selectedColumn ? model.displayColumns.findIndex(col => selectedColumn.index === col.index) : undefined);

    const gridName = title ?? schemaQuery.queryName;

    const closeModal = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const _onUpdate = useCallback(async () => {
        try {
            const viewInfo = model.currentView.mutate({columns: columnsInView});
            await saveAsSessionView(schemaQuery, model.containerPath, viewInfo);
            closeModal();
            onUpdate();
        } catch (error) {
            setSaveError(error);
        }
    }, [model, schemaQuery, columnsInView]);

    const revertEdits = useCallback(() => {
        setColumnsInView(model.displayColumns);
        setIsDirty(false);
    }, [model]);

    const removeColumn = useCallback((deleteIndex: number) => {
        setColumnsInView(columnsInView.filter((column, index) => index !== deleteIndex));
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

    const toggleShowAll = useCallback(() => {
        setShowAllColumns(!showAllColumns);
    }, [showAllColumns]);

    const isColumnInView = (column: QueryColumn) => {
        return columnsInView.findIndex(col => col === column) !== -1;
    }

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
        }
        setIsDirty(true);
    }, [selectedIndex, columnsInView]);

    const onSelectField = useCallback((index): void => {
        if (index === selectedIndex) {
            setSelectedIndex(undefined);
        } else {
            setSelectedIndex(index);
        }
    }, [selectedIndex])

    return (
        <Modal show bsSize="lg" onHide={closeModal}>
            <Modal.Header closeButton>
                <Modal.Title>
                    Customize {gridName} Grid{model.viewName && ' - ' + model.viewName}{model.currentView.session && <span className="alert-info view-edit-alert view-edit-title-alert">Edited</span>}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert>{saveError}</Alert>
                <Row className="field-modal__container">
                    <Col xs={6} className="field-modal__col-2">
                        <div key="title" className="field-modal__col-title">Available Fields</div>
                        <div key="field-list" className="list-group field-modal__col-content">
                            {
                                model.allColumns.filter(column => isColumnInView(column) || ((showAllColumns || !column.hidden) && !column.removeFromViews)).map((column, index) => {
                                    return (
                                        <ColumnChoice
                                            column={column}
                                            index={index}
                                            key={index}
                                            isInView={isColumnInView(column)}
                                            onAddColumn={() => addColumn(column)}
                                        />
                                    );
                                })
                            }
                        </div>
                        <div key={"toggleAll"}>
                            <input type="checkbox" checked={showAllColumns} onChange={toggleShowAll}/>&nbsp;Show all system and user-defined fields
                        </div>
                    </Col>
                    <Col xs={6} className="field-modal__col-2">
                        <div className="field-modal__col-title">
                            <span>Shown in Grid</span>
                            {/* Taking this out for now, until we figure out how to handle session views here */}
                            {/*{!model.currentView.session && isDirty && <span className="pull-right action-text" onClick={revertEdits}>Restore default columns</span>}*/}
                        </div>
                        <DragDropContext onDragEnd={onDropField} >
                            <Droppable droppableId="field-droppable">
                                {dropProvided => (
                                    <div className="list-group field-modal__col-content" {...dropProvided.droppableProps} ref={dropProvided.innerRef}>
                                        {columnsInView.map((column, index) => {
                                            return (
                                                <ColumnInView
                                                    key={index}
                                                    column={column}
                                                    index={index}
                                                    onColumnRemove={() => removeColumn(index)}
                                                    selected={selectedIndex === index}
                                                    onClick={() => onSelectField(index)}
                                                />
                                            )
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
    )
})
