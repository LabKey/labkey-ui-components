/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { fromJS } from 'immutable';

import { QueryInfo } from '../../../public/QueryInfo';
import { DomainDesign, DomainDetails } from '../domainproperties/models';
import { CALCULATED_CONCEPT_URI } from '../domainproperties/constants';

import { ExtendedMap } from '../../../public/ExtendedMap';
import { QueryColumn } from '../../../public/QueryColumn';

import { SAMPLE_COLOR_COLUMN_NAME } from './constants';

import { GroupedSampleFields } from './models';

import { _getGroupedSampleDomainFields, getGroupedSampleDisplayColumns } from './actions';

describe('getGroupedSampleDomainFields', () => {
    const sampleTypeDomain = new DomainDetails({
        options: fromJS({}),
        domainDesign: DomainDesign.create({
            fields: [
                {
                    name: 'Name',
                    fieldKey: 'Name',
                    derivationDataScope: null,
                    conceptURI: undefined,
                },
                {
                    name: 'Spec Char,./',
                    fieldKey: 'Spec Char$C$D$S',
                    derivationDataScope: null,
                    conceptURI: undefined,
                },
                {
                    name: 'Calc,./',
                    fieldKey: 'Calc$C$D$S',
                    derivationDataScope: null,
                    conceptURI: CALCULATED_CONCEPT_URI,
                },
                {
                    name: 'Aliq,./',
                    fieldKey: 'Aliq$C$D$S',
                    derivationDataScope: 'ChildOnly',
                    conceptURI: undefined,
                },
                {
                    name: 'Parent,./',
                    fieldKey: 'Parent$C$D$S',
                    derivationDataScope: 'ParentOnly',
                    conceptURI: undefined,
                },
                {
                    name: 'All,./',
                    fieldKey: 'All$C$D$S',
                    derivationDataScope: 'All',
                    conceptURI: undefined,
                },
            ],
        }),
    });
    const queryInfo = new QueryInfo({
        columns: new ExtendedMap({
            Name: new QueryColumn({
                name: 'Name',
                fieldKey: 'Name',
            }),
            'Spec Char$C$D$S': new QueryColumn({
                name: 'Spec Char,./',
                fieldKey: 'Spec Char$C$D$S',
            }),
            Calc$C$D$S: new QueryColumn({
                name: 'Calc,./',
                fieldKey: 'Calc$C$D$S',
            }),
            Aliq$C$D$S: new QueryColumn({
                name: 'Aliq,./',
                fieldKey: 'Aliq$C$D$S',
            }),
            Parent$C$D$S: new QueryColumn({
                name: 'Parent,./',
                fieldKey: 'Parent$C$D$S',
            }),
            All$C$D$S: new QueryColumn({
                name: 'All,./',
                fieldKey: 'All$C$D$S',
            }),
        }),
    });

    test('field split by derivationDataScope', () => {
        const result = _getGroupedSampleDomainFields(sampleTypeDomain, queryInfo);
        expect(result.aliquotFields).toEqual(['aliq$c$d$s']);
        expect(result.independentFields).toEqual(['all$c$d$s']);
        expect(result.metaFields).toEqual(['name', 'spec char$c$d$s', 'parent$c$d$s']);
    });
});

describe('getGroupedSampleDisplayColumns', () => {
    const col = (fieldKey: string): QueryColumn => new QueryColumn({ fieldKey, name: fieldKey });
    const COLUMNS = [
        col('Name'),
        col('Description'),
        col('MaterialExpDate'),
        col(SAMPLE_COLOR_COLUMN_NAME),
        col('MetaField'),
        col('AliquotField'),
        col('IndependentField'),
    ];
    const DOMAIN_FIELDS: GroupedSampleFields = {
        aliquotFields: ['aliquotfield'],
        independentFields: ['independentfield'],
        metaFields: ['metafield'],
        metricUnit: undefined,
    };

    const editFieldKeys = (isAliquot: boolean): string[] =>
        getGroupedSampleDisplayColumns(COLUMNS, COLUMNS, DOMAIN_FIELDS, isAliquot, false).editColumns.map(
            c => c.fieldKey
        );

    test('aliquot can edit the sample color', () => {
        const fieldKeys = editFieldKeys(true);
        expect(fieldKeys).toContain(SAMPLE_COLOR_COLUMN_NAME);
        // the other aliquot-editable system fields come along, but parent-only meta fields do not
        expect(fieldKeys).toContain('Name');
        expect(fieldKeys).toContain('Description');
        expect(fieldKeys).toContain('MaterialExpDate');
        expect(fieldKeys).toContain('AliquotField');
        expect(fieldKeys).toContain('IndependentField');
        expect(fieldKeys).not.toContain('MetaField');
    });

    test('non-aliquot can edit the sample color', () => {
        const fieldKeys = editFieldKeys(false);
        expect(fieldKeys).toContain(SAMPLE_COLOR_COLUMN_NAME);
        expect(fieldKeys).toContain('MetaField');
        expect(fieldKeys).not.toContain('AliquotField');
    });

    test('sample color displays in the aliquot header only when it is an aliquot field', () => {
        const asAliquotField = { ...DOMAIN_FIELDS, aliquotFields: [SAMPLE_COLOR_COLUMN_NAME.toLowerCase()] };
        const { aliquotHeaderDisplayColumns, aliquotOnlyColumns } = getGroupedSampleDisplayColumns(
            COLUMNS,
            COLUMNS,
            asAliquotField,
            true,
            false
        );
        expect(aliquotHeaderDisplayColumns.map(c => c.fieldKey)).toContain(SAMPLE_COLOR_COLUMN_NAME);
        expect(aliquotOnlyColumns).toContain(SAMPLE_COLOR_COLUMN_NAME);

        // as a plain system field it is editable on the aliquot but not shown in the aliquot header
        expect(
            getGroupedSampleDisplayColumns(COLUMNS, COLUMNS, DOMAIN_FIELDS, true, false)
                .aliquotHeaderDisplayColumns.map(c => c.fieldKey)
        ).not.toContain(SAMPLE_COLOR_COLUMN_NAME);
    });
});
