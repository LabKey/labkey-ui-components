import { fromJS, List, Map } from 'immutable'
import { QueryColumn, QueryGridModel } from '@glass/base'

import rawColumnData from './data/columns.json'
import rawData from './data/data.json'

export interface IActionContext {
    columns: List<QueryColumn>
    columnsByName: Map<string, QueryColumn>
    model: QueryGridModel
    resolveColumns: () => Promise<List<QueryColumn>>
    resolveModel: () => Promise<QueryGridModel>
}

export const createMockActionContext = (dataKey: string): IActionContext => {
    const columns = List<QueryColumn>(rawColumnData[dataKey].columns.map(col => QueryColumn.create(col)));
    const columnsByName = columns.reduce((map, col) => map.set(col.name, col), Map<string, QueryColumn>());
    const data = fromJS(rawData[dataKey]);

    const model = new QueryGridModel({
        dataIds: data.keySeq().toList(),
        data
    });

    return {
        columns,
        columnsByName,
        model,
        resolveColumns: (): Promise<List<QueryColumn>> => Promise.resolve(columns),
        resolveModel: (): Promise<QueryGridModel> => Promise.resolve(model)
    }
};