import React from 'react';
import { ReactWrapper } from 'enzyme';

import { FindDerivativesButton } from './FindDerivativesButton';
import {SampleTypeDataType} from "../entities/constants";
import {makeTestQueryModel} from "../../../public/QueryModel/testUtils";
import {SchemaQuery} from "../../../public/SchemaQuery";
import {mountWithAppServerContext} from "../../testHelpers";
import {QueryInfo} from "../../../public/QueryInfo";

describe('FindDerivativesButton', () => {
    const DEFAULT_PROPS = {
        entityDataType: SampleTypeDataType,
        model: makeTestQueryModel(SchemaQuery.create('schema', 'query'), new QueryInfo()),
    };

    function validate(wrapper: ReactWrapper): void {
        expect(wrapper.find('')).toHaveLength(1);
    }

    test('default props', () => {
        const wrapper = mountWithAppServerContext(
            <FindDerivativesButton {...DEFAULT_PROPS} />
        );
        validate(wrapper);
        wrapper.unmount();
    });
});
