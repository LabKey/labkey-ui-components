import React, { ChangeEvent, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Modal, OverlayTrigger, Popover, Row } from 'react-bootstrap';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import classNames from 'classnames';

import { Alert } from '../../internal/components/base/Alert';
import { saveAsSessionView } from '../../internal/actions';
import { getQueryDetails } from '../../internal/query/api';
import { DragDropHandle } from '../../internal/components/base/DragDropHandle';
import { showPremiumFeatures } from '../../internal/components/administration/utils';

import { QueryColumn } from '../QueryColumn';
import { QueryInfo } from '../QueryInfo';

import { QueryModel } from './QueryModel';

// exported for jest testing
export const includedColumnsForCustomizationFilter = (column: QueryColumn, showAllColumns: boolean): boolean => {
    return (
        (showAllColumns || !column.hidden) &&
        !column.removeFromViews &&
        (showPremiumFeatures() || !column.removeFromViewCustomization) &&
        // Issue 46870: Don't allow selection/inclusion of multi-valued lookup fields from Ancestors
        (!column.fieldKeyPath?.startsWith('Ancestors/') || !column.isJunctionLookup())
    );
};

interface FieldLabelDisplayProps {
    column: QueryColumn;
    editing?: boolean;
    includeFieldKey?: boolean;
    onEditComplete?: (column?: QueryColumn, title?: string) => void;
}

// exported for jest testing
export const FieldLabelDisplay: FC<FieldLabelDisplayProps> = memo(props => {
    const { column, editing, includeFieldKey, onEditComplete } = props;

    const initialTitle = useMemo(() => {
        return column.caption ?? column.name;
    }, [column.caption, column.name]);
    const [title, setTitle] = useState<string>(initialTitle);
    const id = column.index + '-fieldlabel-popover';
    const content = useMemo(() => {
        return <div className="field-name">{initialTitle}</div>;
    }, [initialTitle]);

    useEffect(() => {
        setTitle(initialTitle);
    }, [initialTitle]);

    const onTitleChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
        setTitle(evt.target.value);
    }, []);

    const onInputBlur = useCallback(() => {
        if (title !== initialTitle) {
            onEditComplete(column, title);
        } else {
            onEditComplete();
        }
    }, [column, initialTitle, title, onEditComplete]);

    if (editing) {
        return (
            <input
                autoFocus
                placeholder={undefined}
                className="form-control"
                defaultValue={title}
                onBlur={onInputBlur}
                onChange={onTitleChange}
                type="text"
            />
        );
    }
    // only show hover tooltip for lookup child fields. 46256: use encoded fieldKeyPath
    if (!includeFieldKey || column.fieldKeyPath.indexOf('/') === -1) return content;

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

    // 46256: use encoded fieldKeyPath
    const hasParentFieldKeys = column.fieldKeyPath.indexOf('/') > -1;
    const parentFieldKeys = hasParentFieldKeys
        ? column.fieldKeyPath.substring(0, column.fieldKeyPath.lastIndexOf('/')).split('/')
        : [];

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
        <div className="list-group-item flex" key={colFieldKey} data-fieldkey={colFieldKey}>
            {parentFieldKeys.map((parent, index) => (
                <div className="field-expand-icon" key={colFieldKey + '|' + index} />
            ))}
            <div className="field-expand-icon">
                {column.isLookup() && !isExpanded && <i className="fa fa-plus-square" onClick={_onExpandColumn} />}
                {column.isLookup() && isExpanded && <i className="fa fa-minus-square" onClick={_onCollapseColumn} />}
            </div>
            <FieldLabelDisplay column={column} />
            {isInView && (
                <div className="pull-right view-field__action disabled" title="This field is included in the view.">
                    <i className="fa fa-check" />
                </div>
            )}
            {!isInView && column.selectable && (
                <div
                    className="pull-right view-field__action"
                    title="Add this field to the view."
                    onClick={_onAddColumn}
                >
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
            .filter(fkCol => includedColumnsForCustomizationFilter(fkCol, showAllColumns))
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
    isDragDisabled: boolean;
    onClick: (index: number) => void;
    onEditTitle: () => void;
    onRemoveColumn: (column: QueryColumn) => void;
    onUpdateTitle: (column: QueryColumn, title: string) => void;
    selected: boolean;
}

// exported for jest tests
export const ColumnInView: FC<ColumnInViewProps> = memo(props => {
    const { column, isDragDisabled, onRemoveColumn, onClick, onEditTitle, onUpdateTitle, selected, index } = props;
    const key = column.index;
    const [editing, setEditing] = useState<boolean>(false);

    const _onRemoveColumn = useCallback(() => {
        onRemoveColumn(column);
    }, [column, onRemoveColumn]);

    const _onClick = useCallback(() => {
        onClick(index);
    }, [onClick, index]);

    const _onUpdateTitle = useCallback(
        (column: QueryColumn, title: string) => {
            setEditing(false);
            if (column && title) {
                onUpdateTitle(column, title);
            }
        },
        [onUpdateTitle]
    );

    const _onEditTitle = useCallback(() => {
        setEditing(true);
        onEditTitle();
    }, [onEditTitle]);

    return (
        <Draggable key={key} draggableId={key} index={index} isDragDisabled={isDragDisabled}>
            {(dragProvided, snapshot) => (
                <div
                    className={classNames('list-group-item flex draggable', { active: selected && !editing })}
                    onClick={_onClick}
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                >
                    <div className="right-spacing" {...dragProvided.dragHandleProps}>
                        <DragDropHandle highlighted={snapshot.isDragging} {...dragProvided.dragHandleProps} />
                    </div>
                    <FieldLabelDisplay
                        column={column}
                        includeFieldKey
                        editing={editing}
                        onEditComplete={_onUpdateTitle}
                    />
                    {!editing && (
                        <span className="pull-right">
                            <span
                                className="edit-inline-field__toggle"
                                title="Edit the field's label for this view."
                                onClick={_onEditTitle}
                            >
                                <i id={'select-' + index} className="fa fa-pencil" />
                            </span>
                            <span
                                className="view-field__action clickable"
                                title="Remove this field from the view."
                                onClick={_onRemoveColumn}
                            >
                                <i className="fa fa-times" />
                            </span>
                        </span>
                    )}
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
    const [editingColumnTitle, setEditingColumnTitle] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string>(undefined);
    const [queryDetailError, setQueryDetailError] = useState<string>(undefined);
    const [showAllColumns, setShowAllColumns] = useState<boolean>(false);
    const [expandedColumns, setExpandedColumns] = useState<Record<string, QueryInfo>>({});
    const [selectedIndex, setSelectedIndex] = useState<number>(
        selectedColumn ? model.displayColumns.findIndex(col => selectedColumn.index === col.index) : undefined
    );

    const gridName = title ?? schemaQuery.queryName;

    const closeModal = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const _onUpdate = useCallback(async () => {
        try {
            const viewInfo = model.currentView.mutate({
                columns: columnsInView.map(col => ({
                    fieldKey: col.fieldKeyPath /* 46256: use encoded fieldKeyPath */,
                    title: col.customViewTitle,
                })),
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

    const removeColumn = useCallback(
        (removedColumn: QueryColumn) => {
            setColumnsInView(columnsInView.filter(column => column.index !== removedColumn.index));
            setIsDirty(true);
        },
        [columnsInView]
    );

    const onEditColumnTitle = useCallback(() => {
        setEditingColumnTitle(true);
    }, []);

    const updateColumnTitle = useCallback(
        (updatedColumn: QueryColumn, caption: string) => {
            const relabeledColumn = updatedColumn.mutate({ caption });
            const index = columnsInView.findIndex(column => column.index === updatedColumn.index);
            setColumnsInView([...columnsInView.slice(0, index), relabeledColumn, ...columnsInView.slice(index + 1)]);
            setIsDirty(true);
            setEditingColumnTitle(false);
        },
        [columnsInView]
    );

    const addColumn = useCallback(
        (column: QueryColumn) => {
            if (selectedIndex !== undefined) {
                setColumnsInView([
                    ...columnsInView.slice(0, selectedIndex + 1),
                    column,
                    ...columnsInView.slice(selectedIndex + 1),
                ]);
            } else {
                setColumnsInView([...columnsInView, column]);
            }
            setIsDirty(true);
        },
        [selectedIndex, columnsInView]
    );

    const expandColumn = useCallback(
        async (column: QueryColumn) => {
            try {
                setQueryDetailError(undefined);
                const fkQueryInfo = await getQueryDetails({
                    schemaName: queryInfo.schemaQuery.schemaName,
                    queryName: queryInfo.schemaQuery.queryName,
                    fk: column.index,
                    lookup: column.lookup,
                });
                setExpandedColumns({ ...expandedColumns, [column.index]: fkQueryInfo });
            } catch (error) {
                setQueryDetailError(error.message);
            }
        },
        [queryInfo, expandedColumns]
    );

    const collapseColumn = useCallback(
        (column: QueryColumn) => {
            setQueryDetailError(undefined);
            setExpandedColumns({ ...expandedColumns, [column.index]: undefined });
        },
        [expandedColumns]
    );

    const toggleShowAll = useCallback(() => {
        setShowAllColumns(!showAllColumns);
    }, [showAllColumns]);

    const onDropField = useCallback(
        (dropResult: DropResult): void => {
            const { destination, draggableId, source } = dropResult;
            if (destination === null || source.index === destination.index) {
                return;
            }
            const { index } = destination;

            const colInMotion = columnsInView[source.index];
            let updatedColumns = columnsInView.filter(col => col.index != draggableId);
            updatedColumns = [...updatedColumns.slice(0, index), colInMotion, ...updatedColumns.slice(index)];
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
        },
        [selectedIndex, columnsInView]
    );

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
                                .filter(column => includedColumnsForCustomizationFilter(column, showAllColumns))
                                .filter(column => column.fieldKeyArray.length === 1) // here at the top level we don't want to include lookup fields
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
                            <span
                                className={'pull-right ' + (isDirty ? 'action-text' : 'disabled-action-text')}
                                onClick={isDirty ? revertEdits : undefined}
                            >
                                Undo edits
                            </span>
                        </div>
                        <DragDropContext onDragEnd={onDropField}>
                            <Droppable droppableId="field-droppable">
                                {dropProvided => (
                                    <div
                                        className="list-group field-modal__col-content"
                                        {...dropProvided.droppableProps}
                                        ref={dropProvided.innerRef}
                                    >
                                        {columnsInView.map((column, index) => {
                                            return (
                                                <ColumnInView
                                                    key={column.index}
                                                    column={column}
                                                    index={index}
                                                    isDragDisabled={editingColumnTitle}
                                                    onRemoveColumn={removeColumn}
                                                    selected={selectedIndex === index}
                                                    onClick={onSelectField}
                                                    onEditTitle={onEditColumnTitle}
                                                    onUpdateTitle={updateColumnTitle}
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
