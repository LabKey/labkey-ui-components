import { List, fromJS } from 'immutable';
import React from 'react';

import { mount } from 'enzyme';

import { QueryColumn } from '../../../../public/QueryColumn';

import { LabelHelpTip } from '../../base/LabelHelpTip';

import { DetailDisplay } from './DetailDisplay';

describe('<DetailDisplay/>', () => {
    const namePattenCol = new QueryColumn({
        align: 'left',
        caption: 'Naming Pattern',
        conceptURI: null,
        defaultValue: null,
        dimension: false,
        fieldKey: 'NameExpression',
        fieldKeyArray: ['NameExpression'],
        filterable: true,
        hidden: true,
        inputType: 'textarea',
        isKeyField: false,
        jsonType: 'string',
        measure: false,
        multiValue: false,
        name: 'NameExpression',
        phiProtected: false,
        rangeURI: null,
        readOnly: false,
        required: false,
        shortCaption: 'Naming Pattern',
        shownInDetailsView: true,
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        type: 'Text (String)',
        userEditable: true,
        removeFromViews: false,
        derivationDataScope: null,
    });

    const aliquotNamePattenCol = new QueryColumn({
        align: 'left',
        caption: 'Aliquot Naming Pattern',
        conceptURI: null,
        defaultValue: null,
        dimension: false,
        fieldKey: 'AliquotNameExpression',
        fieldKeyArray: ['AliquotNameExpression'],
        filterable: true,
        hidden: true,
        inputType: 'text',
        isKeyField: false,
        jsonType: 'string',
        measure: false,
        multiValue: false,
        name: 'AliquotNameExpression',
        phiProtected: false,
        rangeURI: null,
        readOnly: false,
        required: false,
        shortCaption: 'Aliquot Naming Pattern',
        shownInDetailsView: true,
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        type: 'Text (String)',
        userEditable: true,
        removeFromViews: false,
        derivationDataScope: null,
    });

    const metricCol = new QueryColumn({
        align: 'left',
        caption: 'Metric Unit',
        conceptURI: null,
        defaultValue: null,
        dimension: false,
        fieldKey: 'MetricUnit',
        fieldKeyArray: ['MetricUnit'],
        filterable: true,
        hidden: true,
        inputType: 'text',
        isKeyField: false,
        jsonType: 'string',
        measure: false,
        multiValue: false,
        name: 'MetricUnit',
        phiProtected: false,
        rangeURI: null,
        readOnly: false,
        required: false,
        shortCaption: 'Metric Unit',
        shownInDetailsView: true,
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        type: 'Text (String)',
        userEditable: true,
        removeFromViews: false,
        derivationDataScope: null,
    });

    test('with fieldHelpTexts', () => {
        const cols = List.of(namePattenCol, aliquotNamePattenCol, metricCol);

        const fieldHelpText = {
            nameexpression: 'Example name that will be generated from the current pattern: S-1001',
            aliquotnameexpression: 'Example aliquot name that will be generated from the current pattern: Sample112.1',
        };

        const data = [
            fromJS({
                NameExpression: {
                    value: 'S-${genId}',
                },
                AliquotNameExpression: {
                    value: '${${AliquotedFrom}.:withCounter}',
                },
                metricCol: {
                    value: 'mL',
                },
            }),
        ];

        const wrapper = mount(
            <DetailDisplay
                asPanel={true}
                editingMode={false}
                data={data}
                displayColumns={cols}
                fieldHelpTexts={fieldHelpText}
            />
        );

        expect(wrapper.find('tr')).toHaveLength(3);
        expect(wrapper.find(LabelHelpTip)).toHaveLength(2);
    });
});
