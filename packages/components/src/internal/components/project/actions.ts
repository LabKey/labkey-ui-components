import { Query } from '@labkey/api';

import { selectRows } from '../../query/selectRows';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { caseInsensitive } from '../../util/utils';
import { DataTypeEntity, ProjectConfigurableDataType } from '../entities/models';
import { getContainerFilter } from '../../query/api';
import { SCHEMAS } from '../../schemas';

export async function getProjectConfigurableEntityTypeOptions(): Promise<{ [key: string]: number[] }> {
    const result = await selectRows({
        columns: 'RowId, Type',
        containerFilter: Query.containerFilter.current, // current folder only
        schemaQuery: new SchemaQuery('exp', 'DataTypeExclusion'),
    });

    const typeExclusions = {};

    result.rows.forEach(row => {
        const rowId = caseInsensitive(row, 'RowId').value;
        const type = caseInsensitive(row, 'Type').value;

        if (!typeExclusions[type]) typeExclusions[type] = [];
        typeExclusions[type].push(rowId);
    });

    return typeExclusions;
}

export function getProjectDataTypeDataCountSql(dataType: ProjectConfigurableDataType): string {
    let typeField = 'SampleSet';
    let from = 'exp.materials ';
    let where = '';

    if (dataType === 'dataclass') {
        typeField = 'dataclass';
        from = 'exp.data ';
        where = 'WHERE DataClass IS NOT NULL ';
    } else if (dataType === 'assaydesign') {
        typeField = 'protocol';
        from = 'exp.AssayRuns ';
    }

    const select = 'SELECT ' + typeField + ' as Type, COUNT(*) as DataCount ';

    const groupBy = 'GROUP BY ' + typeField;

    return select + 'FROM ' + from + where + groupBy;
}

export function getDataTypeDataCount(
    dataType: ProjectConfigurableDataType,
    allDataTypes?: DataTypeEntity[]
): Promise<{ [key: string]: number }> {
    return new Promise((resolve, reject) => {
        const byLsid = dataType === 'sampletype';
        const byLabel = dataType === 'assaydesign';
        const lookup = {};
        if (byLsid && allDataTypes) {
            allDataTypes.forEach(type => {
                lookup[type.lsid] = type.rowId;
            });
        } else if (byLabel && allDataTypes) {
            allDataTypes.forEach(type => {
                lookup[type.label.toLowerCase()] = type.rowId;
            });
        }
        Query.executeSql({
            containerFilter: getContainerFilter(),
            schemaName: SCHEMAS.EXP_TABLES.SCHEMA,
            sql: getProjectDataTypeDataCountSql(dataType),
            success: result => {
                const typeCounts = {};
                result.rows?.forEach(row => {
                    const type = caseInsensitive(row, 'Type');
                    const count = caseInsensitive(row, 'DataCount');
                    if (byLsid) typeCounts[lookup[type]] = count;
                    else if (byLabel) typeCounts[lookup[type.toLowerCase()]] = count;
                    else typeCounts[type] = count;
                });
                resolve(typeCounts);
            },
            failure: error => {
                console.error(error);
                reject(error);
            },
        });
    });
}
