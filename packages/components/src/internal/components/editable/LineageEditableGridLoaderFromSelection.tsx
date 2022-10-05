import { fromJS, List, OrderedMap } from 'immutable';

import { QueryInfo } from '../../../public/QueryInfo';
import { QueryColumn } from '../../../public/QueryColumn';
import { DisplayObject, EntityChoice, EntityParentType } from '../entities/models';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { EditorMode, EditorModel, IEditableGridLoader, IGridResponse } from '../../models';

// exported for unit testing
export function getLineageEditorUpdateColumns(
    queryModel: QueryModel,
    originalParents: Record<string, List<EntityChoice>>
): { columns: List<QueryColumn>; queryInfoColumns: OrderedMap<string, QueryColumn> } {
    // model columns should include RowId, Name, and one column for each distinct existing parent (source and/or
    // sample type) of the selected samples.
    let queryInfoColumns = OrderedMap<string, QueryColumn>();
    let columns = List<QueryColumn>();
    queryModel.queryInfo.columns.forEach((column, key) => {
        if (key === 'rowid') {
            queryInfoColumns = queryInfoColumns.set(key, column);
        } else if (key === 'name') {
            queryInfoColumns = queryInfoColumns.set(key, column);
            // Add "name" column to columns iff it is being utilized as an underlying update column
            if (queryModel.queryInfo.getUpdateColumns().find(col => col.fieldKey.toLowerCase() === 'name')) {
                columns = columns.push(column);
            }
        }
    });
    const parentColumns = {};
    let parentColIndex = 0;
    Object.values(originalParents).forEach(sampleParents => {
        sampleParents.forEach(sampleParent => {
            const { schema, query } = sampleParent.type;
            const parentCol = EntityParentType.create({ index: parentColIndex, schema, query }).generateColumn(
                sampleParent.type.entityDataType.uniqueFieldKey,
                queryModel.schemaName
            );

            if (!parentColumns[parentCol.fieldKey]) {
                parentColumns[parentCol.fieldKey] = parentCol;
                parentColIndex++;
            }
        });
    });
    Object.keys(parentColumns)
        .sort() // Order parent columns so sources come first before sample types, and then alphabetically ordered within the types
        .forEach(key => {
            queryInfoColumns = queryInfoColumns.set(key, parentColumns[key]);
            columns = columns.push(parentColumns[key]);
        });

    return { queryInfoColumns, columns };
}

export class LineageEditableGridLoaderFromSelection implements IEditableGridLoader {
    columns: List<QueryColumn>;
    id: string;
    mode: EditorMode;
    queryInfo: QueryInfo;
    originalParents: Record<string, List<EntityChoice>>;
    lineageKeys: string[];
    lineage: Record<string, any>;
    aliquots?: any[];

    constructor(
        id: string,
        queryModel: QueryModel,
        originalParents: Record<string, List<EntityChoice>>,
        lineageKeys: string[],
        lineage: Record<string, any>,
        aliquots?: string[]
    ) {
        this.id = id;
        this.mode = EditorMode.Update;
        this.originalParents = originalParents;
        this.lineageKeys = lineageKeys;
        this.lineage = lineage;
        this.aliquots = aliquots;

        const { columns, queryInfoColumns } = getLineageEditorUpdateColumns(queryModel, this.originalParents);
        this.columns = columns;
        this.queryInfo = queryModel.queryInfo.merge({ columns: queryInfoColumns }) as QueryInfo;
    }

    fetch(queryModel: QueryModel): Promise<IGridResponse> {
        return new Promise((resolve, reject) => {
            if (!this.lineage) reject('Lineage not defined');
            if (!this.originalParents) reject('Original parents not defined');

            let data = EditorModel.convertQueryDataToEditorData(fromJS(this.lineage));
            Object.keys(this.originalParents).forEach(rowId => {
                this.originalParents[rowId].forEach(parent => {
                    const { schema, query } = parent.type;
                    if (this.aliquots?.indexOf(parseInt(rowId, 10)) > -1) return;
                    const value = List<DisplayObject>(parent.gridValues);
                    const parentType = EntityParentType.create({ schema, query, value });
                    const fieldKey = parentType.generateFieldKey();
                    data = data.setIn([rowId, fieldKey], parentType.value);
                });
            });

            resolve({
                data,
                dataIds: List<string>(this.lineageKeys),
                totalRows: this.lineageKeys.length,
            });
        });
    }
}
