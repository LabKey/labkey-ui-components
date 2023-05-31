import { Query } from '@labkey/api';

import { caseInsensitive } from '../../util/utils';
import { DataTypeEntity, ProjectConfigurableDataType } from '../entities/models';
import { getContainerFilterForFolder } from '../../query/api';
import { SCHEMAS } from '../../schemas';
import {isProductProjectsDataListingScopedToProject} from "../../app/utils";

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

export function getDataTypeDataCount(
    dataType: ProjectConfigurableDataType,
    allDataTypes?: DataTypeEntity[],
    isNewFolder?: boolean,
): Promise<{ [key: string]: number }> {

    return new Promise((resolve, reject) => {
        if (isProductProjectsDataListingScopedToProject() && isNewFolder) {
            resolve({});
            return;
        }

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
