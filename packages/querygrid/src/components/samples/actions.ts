import { Filter } from '@labkey/api'
import { fromJS, List, Map } from 'immutable'
import { DisplayObject, ISampleSetOption, SampleIdCreationModel, SampleSetOption, SampleSetParentType } from './models';
import { getSelected, selectRows } from '@glass/querygrid';
import { naturalSort, SchemaQuery, SCHEMAS } from '@glass/base';

function initParents(initialParents: Array<string>, selectionKey: string): Promise<List<SampleSetParentType>> {
    return new Promise((resolve) => {

        if (selectionKey) {
            const { schemaQuery } = SchemaQuery.parseSelectionKey(selectionKey);

            getSelected(selectionKey).then((selectionResponse) => {
                return selectRows({
                    schemaName: schemaQuery.schemaName,
                    queryName: schemaQuery.queryName,
                    columns: 'LSID,Name,RowId',
                    filterArray: [Filter.create('RowId', selectionResponse.selected, Filter.Types.IN)]
                }).then((samplesResponse) => {
                    resolve(resolveSampleSetParentTypeFromIds(schemaQuery, samplesResponse));
                });
            }).catch(() => {
                console.warn('Unable to parse selectionKey', selectionKey);
                resolve(List<SampleSetParentType>());
            });
        }
        else if (initialParents && initialParents.length > 0) {
            const parent = initialParents[0];
            const [ schema, query, value ] = parent.toLowerCase().split(':');

            return selectRows({
                schemaName: schema,
                queryName: query,
                columns: 'LSID,Name,RowId',
                filterArray: [Filter.create('RowId', value)]
            }).then((samplesResponse) => {
                resolve(resolveSampleSetParentTypeFromIds(SchemaQuery.create(schema, query), samplesResponse));
            });
        }
        else {
            resolve(List<SampleSetParentType>());
        }
    });
}

function resolveSampleSetParentTypeFromIds(schemaQuery: SchemaQuery, response: any): List<SampleSetParentType> {
    const { key, models, orderedModels } = response;
    const rows = fromJS(models[key]);
    let data = List<DisplayObject>();

    // The transformation done here makes the samples compatible with the editable grid
    orderedModels[key].forEach((id) => {
        const row = extractFromRow(rows.get(id));
        data = data.push({
            displayValue: row.label,
            value: row.rowId
        });
    });

    return List<SampleSetParentType>([
        SampleSetParentType.create({
            index: 1,
            schema: schemaQuery.getSchema(),
            query: schemaQuery.getQuery(),
            value: data
        })
    ]);
}

function extractFromRow(row: Map<string, any>): ISampleSetOption {
    return {
        label: row.getIn(['Name', 'value']),
        lsid: row.getIn(['LSID', 'value']),
        rowId: row.getIn(['RowId', 'value']),
        value: row.getIn(['Name', 'value'])
    }
}


export function initSampleSetInsert(model: SampleIdCreationModel)  : Promise<Partial<SampleIdCreationModel>> {
    return new Promise( (resolve) => {

        return Promise.all([
            selectRows({
                schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
                queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName,
                columns: 'LSID,Name,RowId'
            }),
            initParents(model.parents, model.selectionKey)
        ]).then(results => {
            let [ sampleSetResult, sampleParents ] = results;
            const sampleSets = fromJS(sampleSetResult.models[sampleSetResult.key]);
            const sampleCount = sampleParents.find((parent) => parent.value !== undefined) ? 1 : 0;
            const parentOptions = sampleSets.map(row => {
                const name = row.getIn(['Name', 'value']);
                return {
                    value: name.toLowerCase(),
                    label: name,
                    schema: SCHEMAS.SAMPLE_SETS.SCHEMA,
                    query: name // Issue 33653: query name is case-sensitive for some data inputs (sample parents)
                }
            }).toList().sortBy(p => p.label, naturalSort);

            const sampleSetOptions = sampleSets
                .map(row => extractFromRow(row))
                .sortBy(r => r.label, naturalSort)
                .toList();

            let targetSampleSet;
            if (model.initialSampleSet) {
                const setName = model.initialSampleSet.toLowerCase();
                const data = sampleSets.find(row => setName === row.getIn(['Name', 'value']).toLowerCase());

                if (data) {
                    targetSampleSet = new SampleSetOption(extractFromRow(data));
                }
            }
            resolve({
                isInit: true,
                parentOptions,
                sampleCount,
                sampleParents,
                sampleSetOptions,
                targetSampleSet
            })
        })

    });
}
