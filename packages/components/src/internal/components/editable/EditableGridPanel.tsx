import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';

import { getUniqueIdColumnMetadata } from '../entities/utils';

import { EditorModel } from './models';

import { EditableGrid, EditableGridChange, SharedEditableGridPanelProps } from './EditableGrid';

interface EditableGridTabProps {
    activeTab: number;
    getTabTitle: (index: number) => string;
    index: number;
    model: EditorModel;
    setActiveTab: (index: number) => void;
}

export const EditableGridTab: FC<EditableGridTabProps> = memo(props => {
    const { activeTab, getTabTitle, index, model, setActiveTab } = props;
    const tabTitle = useMemo(() => (getTabTitle ? getTabTitle(index) : model.tabTitle), [getTabTitle, model.tabTitle]);
    const className = classNames({ active: index === activeTab });
    const onClick = useCallback(() => setActiveTab(index), [index, setActiveTab]);
    return (
        <li key={tabTitle} className={className}>
            <a onClick={onClick}>{tabTitle}</a>
        </li>
    );
});

export interface EditableGridPanelProps extends SharedEditableGridPanelProps {
    editorModel: EditorModel | EditorModel[];
    getIsDirty?: () => boolean;
    onChange: EditableGridChange;
    setIsDirty?: (isDirty: boolean) => void;
}

/**
 * Note that there are some cases which will call the onChange callback prop back to back (i.e. see LookupCell.onInputChange)
 * and pass through different sets of `editorModelChanges`. In that case, you will want to make sure that your onChange
 * handler is getting the current state object before merging in the `editorModelChanges`. See example in platform/core
 * (core/src/client/LabKeyUIComponentsPage/EditableGridPage.tsx) which uses the set state function which takes a function
 * as the first parameter instead of the new state object.
 */
export const EditableGridPanel: FC<EditableGridPanelProps> = memo(props => {
    const {
        editorModel,
        onChange,
        title,
        bsStyle,
        className = '',
        readonlyRows,
        getReadOnlyRows,
        updateColumns,
        getUpdateColumns,
        getTabHeader,
        getTabTitle,
        readOnlyColumns,
        forUpdate,
        insertColumns,
        ...gridProps
    } = props;
    const [activeTab, setActiveTab] = useState<number>(props.activeTab ?? 0);
    const editorModels = Array.isArray(editorModel) ? editorModel : [editorModel];
    const activeEditorModel = editorModels[activeTab];
    const hasTabs = editorModels.length > 1;
    const _onChange = useCallback<EditableGridChange>(
        (event, editorModelChanges) => onChange(event, editorModelChanges, activeTab),
        [activeTab, onChange]
    );
    let activeReadOnlyRows = readonlyRows;
    if (!activeReadOnlyRows && getReadOnlyRows) activeReadOnlyRows = getReadOnlyRows(activeTab);

    let activeUpdateColumns = updateColumns;
    if (!activeUpdateColumns && getUpdateColumns) activeUpdateColumns = getUpdateColumns(activeTab);

    const editableGrid = (
        <EditableGrid
            {...gridProps}
            editorModel={activeEditorModel}
            onChange={_onChange}
            readonlyRows={activeReadOnlyRows}
            readOnlyColumns={readOnlyColumns}
            updateColumns={activeUpdateColumns}
            insertColumns={insertColumns}
            forUpdate={forUpdate}
        />
    );

    if (!title) {
        return editableGrid;
    }

    return (
        <div className={`panel ${bsStyle === 'info' ? 'panel-info' : 'panel-default'} ${className}`}>
            <div className="panel-heading">{title}</div>
            <div className="panel-body">
                {hasTabs && (
                    <ul className="nav nav-tabs">
                        {editorModels.map((tabModel, index) => (
                            <EditableGridTab
                                activeTab={activeTab}
                                getTabTitle={getTabTitle}
                                index={index}
                                key={index} // eslint-disable-line react/no-array-index-key
                                model={tabModel}
                                setActiveTab={setActiveTab}
                            />
                        ))}
                    </ul>
                )}
                {getTabHeader?.(activeTab)}
                {editableGrid}
            </div>
        </div>
    );
});
