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

/**
 * Note that there are some cases which will call the onChange callback prop back to back (i.e. see LookupCell.onInputChange)
 * and pass through different sets of `editorModelChanges`. In that case, you will want to make sure that your onChange
 * handler is getting the current state object before merging in the `editorModelChanges`. See example in platform/core
 * (core/src/client/LabKeyUIComponentsPage/EditableGridPage.tsx) which uses the set state function which takes a function
 * as the first parameter instead of the new state object.
 */
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
