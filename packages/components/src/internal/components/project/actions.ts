import { Query } from '@labkey/api';

import { caseInsensitive } from '../../util/utils';
import { DataTypeEntity, ProjectConfigurableDataType } from '../entities/models';
import { getContainerFilterForFolder } from '../../query/api';
import { SCHEMAS } from '../../schemas';
import { SchemaQuery } from '../../../public/SchemaQuery';

export function getProjectDataTypeDataCountSql(dataType: ProjectConfigurableDataType): string {
    if (!dataType) return null;

    let typeField = 'SampleSet';
    let from = 'exp.materials ';
    let where = '';

    if (dataType === 'DataClass') {
        typeField = 'dataclass';
        from = 'exp.data ';
        where = 'WHERE DataClass IS NOT NULL ';
    } else if (dataType === 'AssayDesign') {
        typeField = 'protocol';
        from = 'exp.AssayRuns ';
    }

    const select = 'SELECT ' + typeField + ' as Type, COUNT(*) as DataCount ';

    const groupBy = 'GROUP BY ' + typeField;

    return select + 'FROM ' + from + where + groupBy;
}

export function getProjectDataTypeDataCount(
    dataType: ProjectConfigurableDataType,
    allDataTypes?: DataTypeEntity[]
): Promise<Record<string, number>> {
    return new Promise((resolve, reject) => {
        // samples and assay runs reference their data type by lsid, but dataclass data reference by rowid
        const byLsid = dataType === 'SampleType' || dataType === 'AssayDesign';
        const lookup = {};
        if (byLsid && allDataTypes) {
            allDataTypes.forEach(type => {
                lookup[type.lsid] = type.rowId;
            });
        }
        Query.executeSql({
            containerFilter: getContainerFilterForFolder(),
            schemaName: SCHEMAS.EXP_TABLES.SCHEMA,
            sql: getProjectDataTypeDataCountSql(dataType),
            success: result => {
                const typeCounts = {};
                result.rows?.forEach(row => {
                    const type = caseInsensitive(row, 'Type');
                    const count = caseInsensitive(row, 'DataCount');
                    if (byLsid && allDataTypes) typeCounts[lookup[type] + ''] = count;
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
function getDataTypeProjectDataCountSql(dataTypeName: string): string {
    if (!dataTypeName) return null;
    return 'SELECT Folder AS Project, COUNT(*) as DataCount FROM "' + dataTypeName + '" GROUP BY Folder';
}

export function getDataTypeProjectDataCount(schemaQuery: SchemaQuery): Promise<Record<string, number>> {
    return new Promise((resolve, reject) => {
        const sql = getDataTypeProjectDataCountSql(schemaQuery.queryName);
        if (!sql) {
            resolve({});
            return;
        }

        Query.executeSql({
            containerFilter: Query.ContainerFilter.allInProject,
            schemaName: schemaQuery.schemaName,
            sql,
            success: result => {
                const counts = {};
                result.rows?.forEach(row => {
                    const project = caseInsensitive(row, 'Project');
                    counts[project] = caseInsensitive(row, 'DataCount');
                });
                resolve(counts);
            },
            failure: error => {
                console.error(error);
                reject(error);
            },
        });
    });
}
