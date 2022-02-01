import React from 'react';

import { mount } from 'enzyme';

import {EntityFieldFilterModal} from "./EntityFieldFilterModal";
import {getTestAPIWrapper} from "../../APIWrapper";
import {getQueryTestAPIWrapper} from "../../query/APIWrapper";
import {fromJS} from "immutable";
import {GetQueryDetailsOptions} from "../../query/api";
import sampleSetAllFieldTypesQueryInfo from '../../../test/data/sampleSetAllFieldTypes-getQueryDetails.json';
import {TestTypeDataType} from "../../../test/data/constants";
import {waitForLifecycle} from "../../testHelpers";
import {QueryInfo} from "../../../public/QueryInfo";
import {LoadingSpinner} from "../base/LoadingSpinner";
import {ChoicesListItem} from "../base/ChoicesListItem";

const sampleTypes = {
    "SampleSets": [{
        "label": "SampleType_01",
        "lsid": "urn:lsid:labkey.com:SampleSet.Folder-13:SampleType_01",
        "rowId": 21,
        "value": "sampletype_01",
        "query": "SampleType_01",
        "entityDataType": TestTypeDataType,
        "isFromSharedContainer": false,
        "schema": "samples"
    }, {
        "label": "SampleSetAllFieldTypes",
        "lsid": "urn:lsid:labkey.com:SampleSet.Folder-4:SampleSetAllFieldTypes",
        "rowId": 18,
        "value": "samplesetallfieldtypes",
        "query": "samplesetallfieldtypes",
        "entityDataType": TestTypeDataType,
        "isFromSharedContainer": true,
        "schema": "samples"
    }]
};

const DEFAULT_PROPS = {
    api: getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            getEntityTypeOptions: () =>  Promise.resolve(fromJS(sampleTypes)),
            getQueryDetails: (options: GetQueryDetailsOptions) => Promise.resolve(QueryInfo.fromJSON(sampleSetAllFieldTypesQueryInfo))
        }),
    }),
    entityDataType: TestTypeDataType,
    onCancel: jest.fn(),
    onFind: jest.fn(),
    queryName: 'SampleSetAllFieldTypes',
    fieldKey: 'Text',
};

describe('EntityFieldFilterModal', () => {

    test('no initial query selection, no existing filters', async () => {
        const wrapper = mount(
            <EntityFieldFilterModal
                {...DEFAULT_PROPS}
                queryName={null}
                fieldKey={null}
            />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        expect(wrapper.find('ModalTitle').text()).toBe('Select Sample Test Parent Properties');

        const queriesContainer = wrapper.find('.parent-search-panel__col_queries');
        const queriesContainerTitle = queriesContainer.find('.parent-search-panel__col-title');

        const queriesContainerBody = queriesContainer.find('.parent-search-panel__col-content');
        expect(queriesContainerTitle.text()).toBe('test Parents');
        const queries = queriesContainerBody.find(ChoicesListItem);
        expect(queries.length).toBe(2);
        expect(queries.at(0).props().label).toBe('SampleType_01');
        expect(queries.at(1).props().label).toBe('SampleSetAllFieldTypes');

        const fieldsContainerTitle = wrapper.find('.parent-search-panel__col_fields').at(0);
        expect(fieldsContainerTitle.text()).toContain('Fields');
        const fieldsContainerEmptyBody = wrapper.find('.parent-search-panel__empty-msg').at(0);
        expect(fieldsContainerEmptyBody.text()).toContain('Select a test parent.');

        const findButton = wrapper.find('button.btn-success');
        expect(findButton.props().disabled).toBeTruthy();

    });
});

// no initial query selection, with existing filters

// with initial query selection

// with initial filter selection (in long list of values)

