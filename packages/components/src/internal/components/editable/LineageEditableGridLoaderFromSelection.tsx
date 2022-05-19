import {IEditableGridLoader, IGridResponse} from "../../QueryGridModel";
import {QueryInfo} from "../../../public/QueryInfo";
import {fromJS, List, OrderedMap} from "immutable";
import {QueryColumn} from "../../../public/QueryColumn";
import {DisplayObject, EntityChoice, EntityParentType} from "../entities/models";
import {QueryModel} from "../../../public/QueryModel/QueryModel";
import {EditorModel} from "../../models";

// exported for jest testing
export function getLineageEditorUpdateColumns(
    displayQueryModel: QueryModel,
    originalParents: Record<string, List<EntityChoice>>
): { queryInfoColumns: OrderedMap<string, QueryColumn>; updateColumns: List<QueryColumn> } {
    // model columns should include RowId, Name, and one column for each distinct existing parent (source and/or
    // sample type) of the selected samples.
    let queryInfoColumns = OrderedMap<string, QueryColumn>();
    let updateColumns = List<QueryColumn>();
    displayQueryModel.queryInfo.columns.forEach((column, key) => {
        if (key === 'rowid') {
            queryInfoColumns = queryInfoColumns.set(key, column);
        } else if (key === 'name') {
            queryInfoColumns = queryInfoColumns.set(key, column);
            updateColumns = updateColumns.push(column);
        }
    });
    const parentColumns = {};
    let parentColIndex = 0;
    Object.values(originalParents).forEach(sampleParents => {
        sampleParents.forEach(sampleParent => {
            const { schema, query } = sampleParent.type;
            const parentCol = EntityParentType.create({ index: parentColIndex, schema, query }).generateColumn(
                sampleParent.type.entityDataType.uniqueFieldKey,
                displayQueryModel.schemaName
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
            updateColumns = updateColumns.push(parentColumns[key]);
        });

    return { queryInfoColumns, updateColumns };
}

export class LineageEditableGridLoaderFromSelection implements IEditableGridLoader {
    id: string;
    queryInfo: QueryInfo;
    updateColumns: List<QueryColumn>;
    originalParents: Record<string, List<EntityChoice>>;
    lineageKeys: string[];
    lineage: Record<string, any>;

    constructor(
        id: string,
        queryInfo: QueryInfo,
        updateColumns: List<QueryColumn>,
        originalParents: Record<string, List<EntityChoice>>,
        lineageKeys: string[],
        lineage: Record<string, any>
    ) {
        this.id = id;
        this.queryInfo = queryInfo;
        this.updateColumns = updateColumns;
        this.originalParents = originalParents;
        this.lineageKeys = lineageKeys;
        this.lineage = lineage;
    }

    fetch(queryModel: QueryModel): Promise<IGridResponse> {
        return new Promise(resolve => {
            let data = EditorModel.convertQueryDataToEditorData(fromJS(this.lineage));
            Object.keys(this.originalParents).forEach(rowId => {
                this.originalParents[rowId].forEach(parent => {
                    const { schema, query } = parent.type;
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
