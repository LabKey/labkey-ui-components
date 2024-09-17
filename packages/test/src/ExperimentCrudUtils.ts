import { AuditBehaviorTypes } from '@labkey/api';
import { IntegrationTestServer, RequestOptions, successfulResponse } from './integrationUtils';
import { sleep } from './utils';

// TODO, move non sample/dataclass crud util to a generic class
export async function insertRows(server: IntegrationTestServer, rows: any[], schemaName: string, queryName: string, folderOptions: RequestOptions, userOptions: RequestOptions, auditBehavior: AuditBehaviorTypes = AuditBehaviorTypes.DETAILED, debug?: boolean) : Promise<any[]> {
    const response = await server.post('query', 'insertRows', {
        schemaName,
        queryName,
        rows,
        auditBehavior,
    }, { ...folderOptions, ...userOptions }).expect(successfulResponse);
    if (debug)
        console.log(response);
    return response.body.rows;
}

// update using api, rowIds will call _update, lsids will call data iterator
export async function updateRows(server: IntegrationTestServer, rows: any[], schemaName: string, queryName: string, folderOptions: RequestOptions , userOptions: RequestOptions, auditBehavior: AuditBehaviorTypes = AuditBehaviorTypes.DETAILED, debug?: boolean) : Promise<any[]> {
    const response = await server.post('query', 'updateRows', {
        schemaName,
        queryName,
        rows,
        auditBehavior,
    }, { ...folderOptions, ...userOptions }).expect(successfulResponse);

    if (debug)
        console.log(response);

    return response.body.rows;
}

export async function saveRows(server: IntegrationTestServer, containerRows: {[key: string] : any[]}, schemaName: string, queryName: string, command: string = 'update', folderOptions: RequestOptions, userOptions: RequestOptions, auditBehavior: AuditBehaviorTypes = AuditBehaviorTypes.DETAILED, debug?: boolean) : Promise<any> {
    const commands = [];
    Object.keys(containerRows).forEach(container => {
        commands.push({
            schemaName,
            queryName,
            containerPath: container,
            rows: containerRows[container],
            auditBehavior,
            skipReselectRows: true,
            command,
        })
    })
    const response = await server.post('query', 'saveRows', {
        commands
    }, { ...folderOptions, ...userOptions }).expect(successfulResponse);
    if (debug)
        console.log(response);
    return response;
}

export async function getRows(server: IntegrationTestServer, rowIds: number[], schemaName: string, queryName: string, columns: string = 'Name, RowId', folderOptions: RequestOptions , userOptions: RequestOptions, debug?: boolean) : Promise<any[]> {
    const response = await server.post('query', 'selectRows', {
        schemaName,
        queryName,
        'query.RowId~in': rowIds.join(';'),
        'query.columns': columns,
    }, { ...folderOptions, ...userOptions }).expect(successfulResponse);
    if (debug)
        console.log(response);
    return response.body.rows;
}

export async function getAllRows(server: IntegrationTestServer, schemaName: string, queryName: string, columns: string = 'Name, RowId', folderOptions: RequestOptions , userOptions: RequestOptions, debug?: boolean) : Promise<any[]> {
    const response = await server.post('query', 'selectRows', {
        schemaName,
        queryName,
        'query.columns': columns,
    }, { ...folderOptions, ...userOptions }).expect(successfulResponse);
    if (debug)
        console.log(response);
    return response.body.rows;
}

export async function deleteRows(server: IntegrationTestServer, rowIds: number[], schemaName: string, queryName: string, folderOptions: RequestOptions , userOptions: RequestOptions, auditBehavior: AuditBehaviorTypes = AuditBehaviorTypes.DETAILED, debug?: boolean) : Promise<any> {
    const rows = [];
    rowIds.forEach(rowId => {
        rows.push({rowId});
    })
    const response = await server.post('query', 'deleteRows', {
        schemaName,
        queryName,
        rows,
        auditBehavior,
    }, { ...folderOptions, ...userOptions }).expect(successfulResponse);
    if (debug)
        console.log(response);
    return response;
}

export async function insertSamples(server: IntegrationTestServer, rows: any[], sampleType: string, folderOptions: RequestOptions, userOptions: RequestOptions, auditBehavior: AuditBehaviorTypes = AuditBehaviorTypes.DETAILED, debug?: boolean) : Promise<any[]> {
    return await insertRows(server, rows, 'samples', sampleType, folderOptions, userOptions, auditBehavior, debug);
}

export async function createSample(server: IntegrationTestServer, sampleName: string, sampleType: string, folderOptions: RequestOptions, userOptions: RequestOptions, auditBehavior: AuditBehaviorTypes = AuditBehaviorTypes.DETAILED, debug?: boolean) : Promise<any[]> {
    return await insertRows(server, [{ name: sampleName }], 'samples', sampleType, folderOptions, userOptions, auditBehavior, debug);
}

export async function createSource(server: IntegrationTestServer, sourceName: string, sourceType: string, folderOptions: RequestOptions, userOptions: RequestOptions, auditBehavior: AuditBehaviorTypes = AuditBehaviorTypes.DETAILED, debug?: boolean) : Promise<any[]> {
    return await insertRows(server, [{ name: sourceName }], 'exp.data', sourceType, folderOptions, userOptions, auditBehavior, debug);
}


export async function importData(server, importText: string, queryName: string, insertOption = "IMPORT", folderOptions: RequestOptions , userOptions: RequestOptions, useAsync = false, debug?: boolean, isSamples?: boolean) : Promise<any> {
    const response = await server.request('experiment', isSamples ? 'importSamples' : 'importData', (agent, url) => {
            return agent
                .post(url + '?auditBehavior=DETAILED&crossFolderImport=true')
                .type('form')
                .send({
                    schemaName: isSamples ? 'samples' : 'exp.data',
                    queryName,
                    useAsync,
                    insertOption,
                    text: importText,
                    importLookupByAlternateKey: true
                });
        },
        { ...folderOptions, ...userOptions }).expect(successfulResponse);

    if (useAsync)
        await sleep(100);

    if (debug)
        console.log(response);

    return response;
}

// import, update from file, merge
export async function importSample(server: IntegrationTestServer, importText: string, queryName: string, insertOption = "IMPORT", folderOptions: RequestOptions , userOptions: RequestOptions, useAsync = false, debug?: boolean) : Promise<any> {
    return await importData(server, importText, queryName, insertOption, folderOptions, userOptions, useAsync, debug, true);
}

// update using api, rowIds will call _update, lsids will call data iterator
export async function updateSamples(server: IntegrationTestServer, rows: any[], sampleType: string, folderOptions: RequestOptions , userOptions: RequestOptions, auditBehavior: AuditBehaviorTypes = AuditBehaviorTypes.DETAILED, debug?: boolean) : Promise<any[]> {
    return await updateRows(server, rows, 'samples', sampleType, folderOptions, userOptions, auditBehavior, debug);
}

export async function doCrossFolderSamplesAction(server: IntegrationTestServer, containerRows: {[key: string] : any[]}, sampleType: string, command: string = 'update', folderOptions: RequestOptions, userOptions: RequestOptions, auditBehavior: AuditBehaviorTypes = AuditBehaviorTypes.DETAILED, debug?: boolean) : Promise<any> {
    return await saveRows(server, containerRows, 'samples', sampleType, command, folderOptions, userOptions, auditBehavior, debug);
}

export async function deleteSamples(server: IntegrationTestServer, sampleIds: number[], sampleType: string, folderOptions: RequestOptions , userOptions: RequestOptions, auditBehavior: AuditBehaviorTypes = AuditBehaviorTypes.DETAILED, debug?: boolean) : Promise<any> {
    return await deleteRows(server, sampleIds, 'samples', sampleType, folderOptions, userOptions, auditBehavior, debug);
}

export async function getSamplesData(server: IntegrationTestServer, rowIds: number[], sampleType: string, columns: string = 'Name, RowId', folderOptions: RequestOptions , userOptions: RequestOptions, debug?: boolean) : Promise<any[]> {
    return await getRows(server, rowIds, 'samples', sampleType, columns, folderOptions, userOptions, debug);
}

export async function sampleExists(server: IntegrationTestServer, sampleRowId: number, sampleType: string, folderOptions: RequestOptions, userOptions: RequestOptions, debug?: boolean) : Promise<boolean> {
    const response = await getSamplesData(server, [sampleRowId], sampleType, 'RowId', folderOptions, userOptions, debug);
    return response.length === 1;
}

export async function getSampleDataByName(server: IntegrationTestServer, sampleName: string, queryName: string, columns: string = 'Name, RowId', folderOptions: RequestOptions , userOptions: RequestOptions, debug?: boolean) : Promise<any> {
    const response = await server.post('query', 'selectRows', {
        schemaName: 'samples',
        queryName,
        'query.Name~eq': sampleName,
        'query.columns': columns,
    }, { ...folderOptions, ...userOptions }).expect(successfulResponse);
    if (debug)
        console.log(response);
    return response.body.rows[0];
}

export async function getSourcesData(server: IntegrationTestServer, rowIds: number[], sourceType: string, columns: string = 'Name, RowId', folderOptions: RequestOptions , userOptions: RequestOptions, debug?: boolean) : Promise<any[]> {
    return await getRows(server, rowIds, 'exp.data', sourceType, columns, folderOptions, userOptions, debug);
}

export async function sourceExists(server: IntegrationTestServer, sourceRowId: number, sourceType: string, folderOptions: RequestOptions, userOptions: RequestOptions, debug?: boolean) : Promise<boolean> {
    const response = await getSourcesData(server, [sourceRowId], sourceType, 'RowId', folderOptions, userOptions, debug);
    return response.length === 1;
}

export async function getAliquotsByRootId(server: IntegrationTestServer, rootId: number, queryName: string, columns: string = 'Name, RowId, Lsid, rootmaterialrowid, aliquotedfromlsid', folderOptions: RequestOptions , userOptions: RequestOptions, debug?: boolean) : Promise<any[]> {
    const response = await server.post('query', 'selectRows', {
        schemaName: 'samples',
        queryName,
        'query.rootmaterialrowid~eq': rootId,
        'query.rowid~neq': rootId,
        'query.columns': columns,
    }, { ...folderOptions, ...userOptions }).expect(successfulResponse);
    return response.body.rows;
}


