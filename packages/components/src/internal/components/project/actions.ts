import { ActionURL, Ajax, Query, Utils } from '@labkey/api';

import { caseInsensitive, handleRequestFailure } from '../../util/utils';
import { DataTypeEntity, ProjectConfigurableDataType } from '../entities/models';
import { getContainerFilter } from '../../query/api';
import { SCHEMAS } from '../../schemas';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

export async function getProjectExcludedDataTypes(excludedContainer: string): Promise<{ [key: string]: number[] }> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'getDataTypeExclusion.api'),
            method: 'GET',
            params: {
                excludedContainer,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response['excludedDataTypes']);
            }),
            failure: handleRequestFailure(reject, 'Failed to get project exclusion data'),
        });
    });
}

export function getProjectDataTypeDataCountSql(dataType: ProjectConfigurableDataType): string {
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
    allDataTypes?: DataTypeEntity[]
): Promise<{ [key: string]: number }> {
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
            containerFilter: getContainerFilter(),
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
