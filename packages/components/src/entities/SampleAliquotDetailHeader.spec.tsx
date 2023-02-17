import React from 'react';
import renderer from 'react-test-renderer';
import { fromJS, List } from 'immutable';

import { shallow } from 'enzyme';

import { QueryColumn } from '../public/QueryColumn';
import { DefaultRenderer } from '../internal/renderers/DefaultRenderer';
import { UserDetailsRenderer } from '../internal/renderers/UserDetailsRenderer';
import { SampleStatusTag } from '../internal/components/samples/SampleStatusTag';
import { TEST_LKSM_STARTER_MODULE_CONTEXT } from '../internal/productFixtures';

import { SampleAliquotDetailHeader } from './SampleAliquotDetailHeader';

describe('<SampleAliquotDetailHeader/>', () => {
    const COLUMN_ALIQUOT = new QueryColumn({
        fieldKey: 'aliquotspecific',
        caption: 'Aliquot Specific',
        name: 'aliquotspecific',
        fieldKeyArray: ['aliquotspecific'],
        shownInUpdateView: false,
        userEditable: true,
    });

    const aliquotCols = List.of(COLUMN_ALIQUOT);

    const dataRow = fromJS({
        ModifiedBy: { value: 1005, url: '#/q/core/siteusers/1005', displayValue: 'xyang' },
        LSID: { value: 'urn:lsid:labkey.com:Sample.6.sampletype1:S-1-1-3' },
        'SampleSet/LabelColor': { value: '#2980b9' },
        'AliquotedFromLSID/Name': { value: 'S-1-1', url: '#/rd/samples/2' },
        Created: { value: '2021-03-02 14:49:01.568', formattedValue: '2021-03-02 14:49' },
        Modified: { value: '2021-04-15 12:07:25.221', formattedValue: '2021-04-15 12:07' },
        Name: { value: 'S-1-1-3', url: '#/rd/samples/1192' },
        'RootMaterialLSID/Name': { value: 'S-1', url: '#/rd/samples/1' },
        Metadata: { value: 'abcd' },
        RowId: { value: 1192, url: '#/rd/samples/1192' },
        'RootMaterialLSID/Description': { value: '4' },
        SampleSet: {
            value: 'urn:lsid:labkey.com:SampleSet.Folder-6:sampletype1',
            url: '#/samples/sampletype1',
            displayValue: 'sampletype1',
        },
        links: null,
        SampleState: { value: 1, displayValue: 'Available' },
        AliquotSpecific: { value: 'ali-1-1 - child4' },
        Description: { value: 'this is a sub-aliquot - 3' },
        IsAliquot: { value: true },
        CreatedBy: { value: 1005, url: '#/q/core/siteusers/1005', displayValue: 'xyang' },
    });

    test('aliquot detail header, default props', () => {
        const component = shallow(
            <SampleAliquotDetailHeader row={dataRow} aliquotHeaderDisplayColumns={aliquotCols} />
        );
        expect(component.find(DefaultRenderer)).toHaveLength(5);
        expect(component.find(UserDetailsRenderer)).toHaveLength(1);
        expect(component.find(SampleStatusTag)).toHaveLength(0);
    });

    test('aliquot detail header, LKSM context', () => {
        LABKEY.moduleContext = { ...TEST_LKSM_STARTER_MODULE_CONTEXT };

        const component = shallow(
            <SampleAliquotDetailHeader row={dataRow} aliquotHeaderDisplayColumns={aliquotCols} />
        );
        expect(component.find(DefaultRenderer)).toHaveLength(5);
        expect(component.find(UserDetailsRenderer)).toHaveLength(1);
        expect(component.find(SampleStatusTag)).toHaveLength(1);
    });
});
