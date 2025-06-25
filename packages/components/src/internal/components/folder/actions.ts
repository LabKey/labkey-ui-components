import { Query } from '@labkey/api';

import { caseInsensitive } from '../../util/utils';
import { DataTypeEntity, EntityDataType, FolderConfigurableDataType } from '../entities/models';
import { getContainerFilterForFolder } from '../../query/api';
import { SCHEMAS } from '../../schemas';
import { isAllProductFoldersFilteringEnabled, isProductFoldersDataListingScopedToFolder } from '../../app/utils';
import { executeSql } from '../../query/executeSql';

export function getFolderDataTypeDataCountSql(dataType: FolderConfigurableDataType): string {
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

export async function getFolderDataTypeDataCount(
    dataType: FolderConfigurableDataType,
    containerPath?: string,
    allDataTypes?: DataTypeEntity[],
    isNewFolder?: boolean
): Promise<Record<string, number>> {
    if (isProductFoldersDataListingScopedToFolder() && isNewFolder) {
        return {};
    }

    // samples and assay runs reference their data type by lsid, but dataclass data reference by rowid
    const byLsid = dataType === 'SampleType' || dataType === 'AssayDesign';
    const lookup = {};
    if (byLsid && allDataTypes) {
        allDataTypes.forEach(type => {
            lookup[type.lsid] = type.rowId;
        });
    }
    let cf: Query.ContainerFilter;
    if (isNewFolder) {
        cf = isAllProductFoldersFilteringEnabled()
            ? Query.ContainerFilter.allInProjectPlusShared
            : Query.ContainerFilter.currentPlusProjectAndShared;
    } else {
        cf = getContainerFilterForFolder(containerPath);
    }

    const result = await executeSql({
        containerPath,
        containerFilter: cf,
        schemaName: SCHEMAS.EXP_TABLES.SCHEMA,
        sql: getFolderDataTypeDataCountSql(dataType),
    });

    const typeCounts: Record<string, number> = {};
    result.rows?.forEach(row => {
        const type = caseInsensitive(row, 'Type').value;
        const count = caseInsensitive(row, 'DataCount').value;
        if (byLsid && allDataTypes) typeCounts[lookup[type] + ''] = count;
        else typeCounts[type] = count;
    });

    return typeCounts;
}

// exported for jest testing
export function getDataTypeFolderDataCountSql(
    entityDataType: EntityDataType,
    dataTypeRowId: number,
    dataTypeName: string
): string {
    const isAssay = entityDataType.folderConfigurableDataType === 'AssayDesign';
    const isStorage = entityDataType.folderConfigurableDataType === 'StorageLocation';
    const queryName = isAssay || isStorage ? entityDataType.listingSchemaQuery.queryName : dataTypeName;
    const whereClause = isAssay ? `WHERE Protocol.RowId = ${dataTypeRowId}` : '';
    if (!queryName) return null;

    return `SELECT Folder, COUNT(*) as DataCount FROM "${queryName}" ${whereClause} GROUP BY Folder`;
}

export async function getDataTypeFolderDataCount(
    entityDataType: EntityDataType,
    dataTypeRowId: number,
    dataTypeName: string
): Promise<Record<string, number>> {
    const isAssay = entityDataType.folderConfigurableDataType === 'AssayDesign';
    const isStorage = entityDataType.folderConfigurableDataType === 'StorageLocation';
    const schemaName =
        isAssay || isStorage ? entityDataType.listingSchemaQuery.schemaName : entityDataType.instanceSchemaName;
    const sql = getDataTypeFolderDataCountSql(entityDataType, dataTypeRowId, dataTypeName);
    if (!sql) {
        return {};
    }

    const result = await executeSql({
        containerFilter: Query.ContainerFilter.allInProject, // use AllInProject for all cases
        schemaName,
        sql,
        parameters: isStorage ? { ParentId: dataTypeRowId } : undefined,
    });

    return result.rows.reduce<Record<string, number>>((counts, row) => {
        const container = caseInsensitive(row, 'Folder').value;
        counts[container] = caseInsensitive(row, 'DataCount').value;
        return counts;
    }, {});
}
