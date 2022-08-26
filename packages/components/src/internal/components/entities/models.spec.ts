/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { List, Map } from 'immutable';

import {
    EntityIdCreationModel,
    EntityParentType,
    EntityTypeOption,
    getParentEntities,
    getParentOptions, IParentOption,
} from './models';
import {SCHEMAS} from "../../schemas";
import {QueryColumn} from "../../../public/QueryColumn";
import {SampleTypeDataType} from "./constants";

describe('EntityParentType', () => {
    test('generateColumn captionSuffix', () => {
        let col = EntityParentType.create({ schema: SCHEMAS.DATA_CLASSES.SCHEMA, query: 'dataclass' }).generateColumn('Display Column', SCHEMAS.DATA_CLASSES.SCHEMA);
        expect(col.caption).toBe('Dataclass Parents');

        col = EntityParentType.create({ schema: SCHEMAS.DATA_CLASSES.SCHEMA, query: 'dataclass' }).generateColumn(
            'Display Column', SCHEMAS.SAMPLE_SETS.SCHEMA
        );
        expect(col.caption).toBe('Dataclass');

        col = EntityParentType.create({ schema: SCHEMAS.SAMPLE_SETS.SCHEMA, query: 'sampletype' }).generateColumn('Display Column', SCHEMAS.SAMPLE_SETS.SCHEMA);
        expect(col.caption).toBe('Sampletype Parents');

        col = EntityParentType.create({ schema: SCHEMAS.SAMPLE_SETS.SCHEMA, query: 'sampletype' }).generateColumn(
            'Display Column', SCHEMAS.SAMPLE_SETS.SCHEMA
        );
        expect(col.caption).toBe('Sampletype Parents');
    });

    test('generateColumn isAliquotParent', () => {
        let col = EntityParentType.create({ query: 'sampletype' }).generateColumn('Display Column', SCHEMAS.SAMPLE_SETS.SCHEMA);
        expect(col.caption).not.toBe('AliquotedFrom');
        expect(col.description).not.toBe('The parent sample of the aliquot');
        expect(col.lookup.multiValued).toBe('junction');
        expect(col.required).toBe(false);

        col = EntityParentType.create({ query: 'sampletype', isAliquotParent: true }).generateColumn('Display Column', SCHEMAS.SAMPLE_SETS.SCHEMA);
        expect(col.caption).toBe('AliquotedFrom');
        expect(col.description).toBe('The parent sample of the aliquot');
        expect(col.lookup.multiValued).toBe(undefined);
        expect(col.required).toBe(true);
    });

    test('generateColumn parentColName', () => {
        let col = EntityParentType.create({ query: 'sampletype' }).generateColumn('Display Column', SCHEMAS.SAMPLE_SETS.SCHEMA);
        expect(col.name).toBe('MaterialInputs/Sampletype');
        expect(col.fieldKey).toBe('MaterialInputs/Sampletype');
        expect(col.fieldKeyArray[0]).toBe('MaterialInputs/Sampletype');

        col = EntityParentType.create({ query: 'sampletype', isAliquotParent: true }).generateColumn('Display Column', SCHEMAS.SAMPLE_SETS.SCHEMA);
        expect(col.name).toBe('AliquotedFrom');
        expect(col.fieldKey).toBe('AliquotedFrom');
        expect(col.fieldKeyArray[0]).toBe('AliquotedFrom');
    });

    test('generateColumn displayColumn', () => {
        let col = EntityParentType.create({ query: 'sampletype' }).generateColumn('Display Column', SCHEMAS.DATA_CLASSES.SCHEMA);
        expect(col.lookup.displayColumn).toBe('Display Column');

        col = EntityParentType.create({
            schema: SCHEMAS.DATA_CLASSES.INGREDIENTS.schemaName,
            query: SCHEMAS.DATA_CLASSES.INGREDIENTS.queryName,
        }).generateColumn('Display Column', SCHEMAS.DATA_CLASSES.SCHEMA);
        expect(col.lookup.displayColumn).toBe('scientificName');
    });

    test('generateFieldKey', () => {
        expect(EntityParentType.create({ query: 'test' }).generateFieldKey()).toBe('MaterialInputs/Test');
        expect(EntityParentType.create({ query: 'test', isAliquotParent: true }).generateFieldKey()).toBe(
            'AliquotedFrom'
        );
        expect(EntityParentType.create({ schema: SCHEMAS.DATA_CLASSES.SCHEMA, query: 'test' }).generateFieldKey()).toBe(
            'DataInputs/Test'
        );
        expect(
            EntityParentType.create({
                schema: SCHEMAS.DATA_CLASSES.SCHEMA,
                query: 'test',
                isAliquotParent: true,
            }).generateFieldKey()
        ).toBe('AliquotedFrom');
    });

    test('getInputType', () => {
        expect(
            EntityParentType.create({
                schema: SCHEMAS.DATA_CLASSES.SCHEMA,
            }).getInputType()
        ).toBe(QueryColumn.DATA_INPUTS);
        expect(
            EntityParentType.create({
                schema: SCHEMAS.SAMPLE_SETS.SCHEMA,
            }).getInputType()
        ).toBe(QueryColumn.MATERIAL_INPUTS);
        expect(
            EntityParentType.create({
                schema: SCHEMAS.SAMPLE_SETS.SCHEMA,
                isAliquotParent: true,
            }).getInputType()
        ).toBe(QueryColumn.ALIQUOTED_FROM);
    });

    test('createColumnName', () => {
        expect(
            EntityParentType.create({
                schema: SCHEMAS.DATA_CLASSES.SCHEMA,
                query: 'TEST',
            }).createColumnName()
        ).toBe('DataInputs/TEST');
        expect(
            EntityParentType.create({
                schema: SCHEMAS.SAMPLE_SETS.SCHEMA,
                query: 'TEST',
            }).createColumnName()
        ).toBe('MaterialInputs/TEST');
    });
});

describe('EntityIdCreationModel', () => {
    test('getEmptyEntityParents', () => {
        const map = EntityIdCreationModel.getEmptyEntityParents(List<string>(['a', 'b']));
        expect(map.size).toBe(2);
        expect(map.get('a').size).toBe(0);
        expect(map.get('b').size).toBe(0);
    });

    test('hasTargetEntityType', () => {
        expect(new EntityIdCreationModel({ targetEntityType: undefined }).hasTargetEntityType()).toBeFalsy();
        expect(
            new EntityIdCreationModel({ targetEntityType: new EntityTypeOption() }).hasTargetEntityType()
        ).toBeFalsy();
        expect(
            new EntityIdCreationModel({
                targetEntityType: new EntityTypeOption({ value: undefined }),
            }).hasTargetEntityType()
        ).toBeFalsy();
        expect(
            new EntityIdCreationModel({
                targetEntityType: new EntityTypeOption({ value: 'a', label: 'A' }),
            }).hasTargetEntityType()
        ).toBeTruthy();
    });

    test('getTargetEntityTypeValue', () => {
        expect(
            new EntityIdCreationModel({
                targetEntityType: new EntityTypeOption({ value: undefined }),
            }).getTargetEntityTypeValue()
        ).toBe(undefined);
        expect(
            new EntityIdCreationModel({
                targetEntityType: new EntityTypeOption({ value: 'a', label: 'A' }),
            }).getTargetEntityTypeValue()
        ).toBe('a');
    });

    test('getTargetEntityTypeLabel', () => {
        expect(
            new EntityIdCreationModel({
                targetEntityType: new EntityTypeOption({ value: undefined }),
            }).getTargetEntityTypeLabel()
        ).toBe(undefined);
        expect(
            new EntityIdCreationModel({
                targetEntityType: new EntityTypeOption({ value: 'a', label: 'A' }),
            }).getTargetEntityTypeLabel()
        ).toBe('A');
    });

    test('getSchemaQuery', () => {
        const sq = new EntityIdCreationModel({
            entityDataType: SampleTypeDataType,
            targetEntityType: new EntityTypeOption({ value: 'a', label: 'A' }),
        });
        expect(sq.getSchemaQuery().schemaName).toBe('samples');
        expect(sq.getSchemaQuery().queryName).toBe('a');
    });
});

describe('getParentOptions', () => {
    let parentOptions = Map<string, List<IParentOption>>();
    beforeAll(() => {
        parentOptions = parentOptions.set(
            'query1',
            List.of(
                { schema: 'a', query: 'test1a', value: 'test1a' },
                { schema: 'a', query: 'test2a', value: 'test2a' },
                { schema: 'a', query: 'test3a', value: 'test3a' }
            )
        );
        parentOptions = parentOptions.set(
            'query2',
            List.of(
                { schema: 'b', query: 'test1b', value: 'test1b' },
                { schema: 'b', query: 'test2b', value: 'test2b' },
                { schema: 'b', query: 'test3b', value: 'test3b' }
            )
        );
    });

    let entityParents;
    beforeEach(() => {
        entityParents = Map<string, List<EntityParentType>>();
        entityParents = entityParents.set('query1', List());
        entityParents = entityParents.set('query2', List());
    });

    test('queryName, without current selection', () => {
        const options = getParentOptions(parentOptions, entityParents, undefined, 'query1', false);
        expect(options.length).toBe(3);
        expect(options[0].query).toBe('test1a');
        expect(options[1].query).toBe('test2a');
        expect(options[2].query).toBe('test3a');
    });

    test('queryName, with current selection', () => {
        entityParents = entityParents.set('query1', List.of(EntityParentType.create({ schema: 'a', query: 'test2a' })));

        const options = getParentOptions(parentOptions, entityParents, 'test2a', 'query1', false);
        expect(options.length).toBe(3);
        expect(options[0].query).toBe('test1a');
        expect(options[1].query).toBe('test2a');
        expect(options[2].query).toBe('test3a');
    });

    test('queryName, with current selection, filter other selections', () => {
        entityParents = entityParents.set(
            'query1',
            List.of(
                EntityParentType.create({ schema: 'a', query: 'test1a' }),
                EntityParentType.create({ schema: 'a', query: 'test2a' })
            )
        );

        const options = getParentOptions(parentOptions, entityParents, 'test2a', 'query1', false);
        expect(options.length).toBe(2);
        expect(options[0].query).toBe('test2a');
        expect(options[1].query).toBe('test3a');
    });

    test('combineParentTypes, with current selection, filter other selections', () => {
        entityParents = entityParents.set(
            'query1',
            List.of(
                EntityParentType.create({ schema: 'a', query: 'test1a' }),
                EntityParentType.create({ schema: 'a', query: 'test2a' })
            )
        );
        entityParents = entityParents.set('query2', List.of(EntityParentType.create({ schema: 'b', query: 'test1b' })));

        const options = getParentOptions(parentOptions, entityParents, 'test2a', undefined, true);
        expect(options.length).toBe(4);
        expect(options[0].query).toBe('test2a');
        expect(options[1].query).toBe('test3a');
        expect(options[2].query).toBe('test2b');
        expect(options[3].query).toBe('test3b');
    });
});

describe('getParentEntities', () => {
    let entityParents = Map<string, List<EntityParentType>>();
    beforeEach(() => {
        entityParents = entityParents.set(
            'query1',
            List.of(
                EntityParentType.create({ schema: 'a', query: 'test1a' }),
                EntityParentType.create({ schema: 'a', query: 'test2a' })
            )
        );
        entityParents = entityParents.set(
            'query2',
            List.of(
                EntityParentType.create({ schema: 'b', query: 'test1b' }),
                EntityParentType.create({ schema: 'b', query: 'test2b' })
            )
        );
    });

    test('without combineParentTypes or queryName', () => {
        expect(getParentEntities(entityParents, false, undefined).size).toBe(0);
    });

    test('queryName', () => {
        const entities = getParentEntities(entityParents, false, 'query2');
        expect(entities.size).toBe(2);
        expect(entities.get(0).query).toBe('test1b');
        expect(entities.get(1).query).toBe('test2b');
    });

    test('combineParentTypes', () => {
        const entities = getParentEntities(entityParents, true, 'query2');
        expect(entities.size).toBe(4);
        expect(entities.get(0).query).toBe('test1a');
        expect(entities.get(1).query).toBe('test2a');
        expect(entities.get(2).query).toBe('test1b');
        expect(entities.get(3).query).toBe('test2b');
        expect(entities.get(0).index).toBe(1);
        expect(entities.get(1).index).toBe(2);
        expect(entities.get(2).index).toBe(3);
        expect(entities.get(3).index).toBe(4);
    });
});
