import { fromJS } from 'immutable';

import { QueryInfo } from '../../../public/QueryInfo';
import { DomainDesign, DomainDetails } from '../domainproperties/models';
import { CALCULATED_CONCEPT_URI } from '../domainproperties/constants';

import { ExtendedMap } from '../../../public/ExtendedMap';
import { QueryColumn } from '../../../public/QueryColumn';

import { _getGroupedSampleDomainFields } from './actions';

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
        expect(result.aliquotFields.length).toBe(1);
        expect(result.aliquotFields[0]).toBe('aliq$c$d$s');
        expect(result.independentFields.length).toBe(1);
        expect(result.independentFields[0]).toBe('all$c$d$s');
        expect(result.metaFields.length).toBe(3);
        expect(result.metaFields[0]).toBe('name');
        expect(result.metaFields[1]).toBe('spec char$c$d$s');
        expect(result.metaFields[2]).toBe('parent$c$d$s');
    });
});
