import { fromJS, List } from 'immutable';

import { IEditableGridLoader, IGridResponse } from '../../QueryGridModel';
import { QueryInfo } from '../../../public/QueryInfo';
import { QueryColumn } from '../../../public/QueryColumn';
import { DisplayObject, EntityChoice, EntityParentType } from '../entities/models';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { EditorModel } from '../../models';

export class LineageEditableGridLoaderFromSelection implements IEditableGridLoader {
    id: string;
    queryInfo: QueryInfo;
    updateColumns: List<QueryColumn>;
    originalParents: Record<string, List<EntityChoice>>;
    lineageKeys: string[];
    lineage: Record<string, any>;
    aliquots?: any[];

    constructor(
        id: string,
        queryInfo: QueryInfo,
        updateColumns: List<QueryColumn>,
        originalParents: Record<string, List<EntityChoice>>,
        lineageKeys: string[],
        lineage: Record<string, any>,
        aliquotKeys: string[],
    ) {
        this.id = id;
        this.queryInfo = queryInfo;
        this.updateColumns = updateColumns;
        this.originalParents = originalParents;
        this.lineageKeys = lineageKeys;
        this.lineage = lineage;
        this.aliquots = aliquotKeys;
    }

    fetch(queryModel: QueryModel): Promise<IGridResponse> {
        return new Promise((resolve, reject) => {
            if (!this.lineage) reject('Lineage not defined');

            if (!this.originalParents) reject('Original parents not defined');

            let data = EditorModel.convertQueryDataToEditorData(fromJS(this.lineage));
            Object.keys(this.originalParents).forEach(rowId => {
                this.originalParents[rowId].forEach(parent => {
                    const { schema, query } = parent.type;
                    if (this.aliquots?.indexOf(parseInt(rowId)) > -1)
                        return;
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
