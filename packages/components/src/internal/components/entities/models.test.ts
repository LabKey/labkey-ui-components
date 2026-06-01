/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List } from 'immutable';

import { SCHEMAS } from '../../schemas';
import { QueryColumn } from '../../../public/QueryColumn';

import { EntityIdCreationModel, EntityParentType, EntityTypeOption, OperationConfirmationData } from './models';
import { SampleTypeDataType } from './constants';

describe('EntityParentType', () => {
    test('generateColumn captionSuffix', () => {
        let col = EntityParentType.create({ schema: SCHEMAS.DATA_CLASSES.SCHEMA, query: 'dataclass' }).generateColumn(
            'Display Column',
            SCHEMAS.DATA_CLASSES.SCHEMA
        );
        expect(col.caption).toBe('dataclass Parents');

        col = EntityParentType.create({ schema: SCHEMAS.DATA_CLASSES.SCHEMA, query: 'dataclass' }).generateColumn(
            'Display Column',
            SCHEMAS.SAMPLE_SETS.SCHEMA
        );
        expect(col.caption).toBe('dataclass');

        col = EntityParentType.create({ schema: SCHEMAS.SAMPLE_SETS.SCHEMA, query: 'sampletype' }).generateColumn(
            'Display Column',
            SCHEMAS.SAMPLE_SETS.SCHEMA
        );
        expect(col.caption).toBe('sampletype Parents');

        col = EntityParentType.create({
            schema: SCHEMAS.SAMPLE_SETS.SCHEMA,
            query: 'sampletype',
            label: 'Sample Type Label',
        }).generateColumn('Display Column', SCHEMAS.SAMPLE_SETS.SCHEMA);
        expect(col.caption).toBe('Sample Type Label Parents');
    });

    test('generateColumn isAliquotParent', () => {
        let col = EntityParentType.create({ query: 'sampletype' }).generateColumn(
            'Display Column',
            SCHEMAS.SAMPLE_SETS.SCHEMA
        );
        expect(col.caption).not.toBe('AliquotedFrom');
        expect(col.description).not.toBe('The parent sample of the aliquot');
        expect(col.lookup.multiValued).toBe('junction');
        expect(col.required).toBe(false);

        col = EntityParentType.create({ query: 'sampletype', isAliquotParent: true }).generateColumn(
            'Display Column',
            SCHEMAS.SAMPLE_SETS.SCHEMA
        );
        expect(col.caption).toBe('Aliquoted From');
        expect(col.description).toBe('The parent sample of the aliquot');
        expect(col.lookup.multiValued).toBe(undefined);
        expect(col.required).toBe(true);
    });

    test('generateColumn parentColName', () => {
        let col = EntityParentType.create({ query: 'Sampletype' }).generateColumn(
            'Display Column',
            SCHEMAS.SAMPLE_SETS.SCHEMA
        );
        expect(col.name).toBe('MaterialInputs/Sampletype');
        expect(col.fieldKey).toBe('MaterialInputs/Sampletype');
        expect(col.fieldKeyArray[0]).toBe('MaterialInputs/Sampletype');

        col = EntityParentType.create({ query: 'sampletype', isAliquotParent: true }).generateColumn(
            'Display Column',
            SCHEMAS.SAMPLE_SETS.SCHEMA
        );
        expect(col.name).toBe('AliquotedFrom');
        expect(col.fieldKey).toBe('AliquotedFrom');
        expect(col.fieldKeyArray[0]).toBe('AliquotedFrom');
    });

    test('generateColumn displayColumn', () => {
        let col = EntityParentType.create({ query: 'sampletype' }).generateColumn(
            'Display Column',
            SCHEMAS.DATA_CLASSES.SCHEMA
        );
        expect(col.lookup.displayColumn).toBe('Display Column');

        col = EntityParentType.create({
            schema: SCHEMAS.DATA_CLASSES.INGREDIENTS.schemaName,
            query: SCHEMAS.DATA_CLASSES.INGREDIENTS.queryName,
        }).generateColumn('Display Column', SCHEMAS.DATA_CLASSES.SCHEMA);
        expect(col.lookup.displayColumn).toBe('scientificName');
    });

    test('generateFieldKey', () => {
        expect(EntityParentType.create({ query: 'test' }).generateFieldKey()).toBe('MaterialInputs/test');
        expect(EntityParentType.create({ query: 'test,./' }).generateFieldKey()).toBe('MaterialInputs/test$C$P$S');
        expect(EntityParentType.create({ query: 'Test', label: 'TEST' }).generateFieldKey()).toBe(
            'MaterialInputs/Test'
        );
        expect(EntityParentType.create({ query: 'test', isAliquotParent: true }).generateFieldKey()).toBe(
            'AliquotedFrom'
        );
        expect(EntityParentType.create({ schema: SCHEMAS.DATA_CLASSES.SCHEMA, query: 'Test' }).generateFieldKey()).toBe(
            'DataInputs/Test'
        );
        expect(
            EntityParentType.create({
                schema: SCHEMAS.DATA_CLASSES.SCHEMA,
                query: 'Test',
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

        expect(sq.getSchemaQuery('altTarget').schemaName).toBe('samples');
        expect(sq.getSchemaQuery('altTarget').queryName).toBe('altTarget');
    });
});

describe('OperationConfirmationData', () => {
    const data = new OperationConfirmationData({
        allowed: [{ rowId: 1 }, { rowId: 2 }],
        notAllowed: [{ rowId: 3 }, { rowId: 4 }, { rowId: 5 }],
        notPermitted: [{ rowId: 6 }],
    });

    test('isIdActionable', () => {
        expect(data.isIdActionable('1')).toBe(true);
        expect(data.isIdActionable(1)).toBe(true);
        expect(data.isIdActionable('3')).toBe(false);
        expect(data.isIdActionable(3)).toBe(false);
        expect(data.isIdActionable('6')).toBe(false);
        expect(data.isIdActionable(6)).toBe(false);
    });

    test('getActionableIds', () => {
        expect(data.getActionableIds()).toEqual([1, 2]);
        expect(data.getActionableIds('bogus')).toEqual([]);
    });

    test('allActionable', () => {
        expect(data.allActionable).toBe(false);
        expect(
            new OperationConfirmationData({
                allowed: [{ rowId: 1 }, { rowId: 2 }],
                notAllowed: [],
                notPermitted: [],
            }).allActionable
        ).toBe(true);
    });

    test('noneActionable', () => {
        expect(data.noneActionable).toBe(false);
        expect(
            new OperationConfirmationData({
                allowed: [],
                notAllowed: [],
                notPermitted: [],
            }).noneActionable
        ).toBe(false);
        expect(
            new OperationConfirmationData({
                allowed: [{ rowId: 1 }, { rowId: 2 }],
                notAllowed: [],
                notPermitted: [],
            }).noneActionable
        ).toBe(false);
        expect(
            new OperationConfirmationData({
                allowed: [],
                notAllowed: [{ rowId: 1 }, { rowId: 2 }],
                notPermitted: [],
            }).noneActionable
        ).toBe(true);
        expect(
            new OperationConfirmationData({
                allowed: [],
                notAllowed: [],
                notPermitted: [{ rowId: 1 }, { rowId: 2 }],
            }).noneActionable
        ).toBe(true);
    });

    test('anyActionable', () => {
        expect(data.anyActionable).toBe(true);
        expect(
            new OperationConfirmationData({
                allowed: [],
                notAllowed: [],
                notPermitted: [],
            }).anyActionable
        ).toBe(false);
        expect(
            new OperationConfirmationData({
                allowed: [{ rowId: 1 }, { rowId: 2 }],
                notAllowed: [],
                notPermitted: [],
            }).anyActionable
        ).toBe(true);
        expect(
            new OperationConfirmationData({
                allowed: [],
                notAllowed: [{ rowId: 1 }, { rowId: 2 }],
                notPermitted: [],
            }).anyActionable
        ).toBe(false);
        expect(
            new OperationConfirmationData({
                allowed: [],
                notAllowed: [],
                notPermitted: [{ rowId: 1 }, { rowId: 2 }],
            }).anyActionable
        ).toBe(false);
    });

    test('anyNotActionable', () => {
        expect(data.anyNotActionable).toBe(true);
        expect(
            new OperationConfirmationData({
                allowed: [],
                notAllowed: [],
                notPermitted: [],
            }).anyNotActionable
        ).toBe(false);
        expect(
            new OperationConfirmationData({
                allowed: [{ rowId: 1 }, { rowId: 2 }],
                notAllowed: [],
                notPermitted: [],
            }).anyNotActionable
        ).toBe(false);
        expect(
            new OperationConfirmationData({
                allowed: [],
                notAllowed: [{ rowId: 1 }, { rowId: 2 }],
                notPermitted: [],
            }).anyNotActionable
        ).toBe(true);
        expect(
            new OperationConfirmationData({
                allowed: [],
                notAllowed: [],
                notPermitted: [{ rowId: 1 }, { rowId: 2 }],
            }).anyNotActionable
        ).toBe(true);
    });

    test('totalCount', () => {
        expect(data.totalCount).toBe(5);
        expect(
            new OperationConfirmationData({
                allowed: [],
                notAllowed: [],
                notPermitted: [],
            }).totalCount
        ).toBe(0);
    });

    test('getContainerPaths', () => {
        expect(
            new OperationConfirmationData({
                containers: [
                    { id: 'a', permitted: true },
                    { id: 'b', permitted: false },
                    { id: 'c', permitted: true },
                ],
            }).getContainerPaths()
        ).toEqual(['a', 'c']);
    });
});
