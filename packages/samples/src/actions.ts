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
                    filterArray: [Filter.create('RowId', selectionResponse.selected, Filter.Types.IN)]
                }).then((samplesResponse) => {
                    const { key, models, orderedModels } = samplesResponse;
                    const rows = fromJS(models[key]);
                    let data = List<DisplayObject>();

                    // The transformation done here makes the samples compatible with the editable grid
                    orderedModels[key].forEach((id) => {
                        data = data.push({
                            displayValue: rows.getIn([id, 'Name', 'value']),
                            value: rows.getIn([id, 'RowId', 'value'])
                        });
                    });

                    resolve(List<SampleSetParentType>([
                        SampleSetParentType.create({
                            index: 1,
                            query: schemaQuery.queryName,
                            schema: schemaQuery.schemaName,
                            value: data
                        })
                    ]))
                });
            }).catch(() => {
                console.warn('Unable to parse selectionKey', selectionKey);
                resolve(List<SampleSetParentType>());
            });
        }
        else if (initialParents && initialParents.length > 0) {

            resolve(List<SampleSetParentType>(initialParents.map((parent, i) => {
                const [ schema, query, id ] = parent.toLowerCase().split(':');

                const value = List<DisplayObject> ( {
                    displayValue: id,
                    value: id
                });

                return SampleSetParentType.create({
                    index: i + 1,
                    query,
                    schema,
                    value: List<any>([value])
                })
            })));
        }
        else {
            resolve(List<SampleSetParentType>());
        }
    });
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
