import React, { FC, memo, PropsWithChildren } from 'react';

import { EditorModel } from './models';
import { EditableGrid, EditableGridChange, SharedEditableGridPanelProps } from './EditableGrid';

export interface EditableGridPanelProps extends SharedEditableGridPanelProps, PropsWithChildren {
    editorModel: EditorModel;
    getIsDirty?: () => boolean;
    onChange: EditableGridChange;
    setIsDirty?: (isDirty: boolean) => void;
}

/**
 * TODO: This docstring really belongs on EditableGrid, but maybe still have a docstring that tells people to look at
 *  the EditableGrid docstring.
 * Note that there are some cases which will call the onChange callback prop back to back (i.e. see LookupCell.onInputChange)
 * and pass through different sets of `editorModelChanges`. In that case, you will want to make sure that your onChange
 * handler is getting the current state object before merging in the `editorModelChanges`. See example in platform/core
 * (core/src/client/LabKeyUIComponentsPage/EditableGridPage.tsx) which uses the set state function which takes a function
 * as the first parameter instead of the new state object.
 */

// TODO: Find all usages that do not pass title, bstyle, className, or children to EditableGridPanel and make them use
//  EditableGrid directly
export const EditableGridPanel: FC<EditableGridPanelProps> = memo(props => {
    const { title, bsStyle, children, className = '', ...gridProps } = props;
    const editableGrid = <EditableGrid {...gridProps} />;

    if (!title) {
        return editableGrid;
    }

    return (
        <div className={`panel ${bsStyle === 'info' ? 'panel-info' : 'panel-default'} ${className}`}>
            <div className="panel-heading">{title}</div>
            <div className="panel-body">
                {children}
                {editableGrid}
            </div>
        </div>
    );
});
