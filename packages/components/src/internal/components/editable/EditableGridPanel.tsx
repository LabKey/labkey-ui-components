import { fromJS, List, Map } from 'immutable';
import React, { FC, memo, useMemo } from 'react';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { EditorModel, EditorModelProps } from '../../models';

import { EditableGrid, SharedEditableGridProps } from './EditableGrid';

interface Props extends SharedEditableGridProps {
    editorModel: EditorModel;
    model: QueryModel;
    onChange: (
        editorModelChanges: Partial<EditorModelProps>,
        dataKeys?: List<any>,
        data?: Map<any, Map<string, any>>
    ) => void;
    title?: string;
}

export const EditableGridPanel: FC<Props> = memo(props => {
    const { editorModel, model, onChange, title, ...gridProps } = props;

    // TODO: When EditableGridPanelDeprecated is removed we should be able to just pass model.rows and model.orderedRows
    //  to the EditableGrid.
    const { orderedRows, queryInfo, rows } = model;
    const data = useMemo(() => fromJS(rows), [rows]);
    const dataKeys = useMemo(() => fromJS(orderedRows), [orderedRows]);
    const error = model.hasLoadErrors ? model.loadErrors[0] : undefined;
    const editableGrid = (
        <EditableGrid
            {...gridProps}
            data={data}
            dataKeys={dataKeys}
            editorModel={editorModel}
            error={error}
            onChange={onChange}
            queryInfo={queryInfo}
        />
    );

    if (!title) {
        return editableGrid;
    }

    return (
        <div className="panel">
            <div className="panel-heading">{title}</div>
            <div className="panel-body">{editableGrid}</div>
        </div>
    );
});
