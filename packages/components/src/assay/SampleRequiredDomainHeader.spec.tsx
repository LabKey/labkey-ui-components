import React from 'react'
import { List } from "immutable";
import renderer from 'react-test-renderer'
import {SampleRequiredDomainHeader} from "./SampleRequiredDomainHeader";
import { DomainDesign } from '../internal/components/domainproperties/models';
import { RANGE_URIS, SAMPLE_TYPE_CONCEPT_URI } from '../internal/components/domainproperties/constants';
import { SAMPLE_TYPE } from '../internal/components/domainproperties/PropDescType';
import { mount } from 'enzyme';
import { Alert } from '../internal/components/base/Alert';
import { FormControl } from 'react-bootstrap';

describe('SampleRequiredDomainHeader', () => {
    const BASE_DOMAIN = DomainDesign.create({
        name: 'Basic Domain',
        fields: [{
            name: 'key',
            rangeURI: RANGE_URIS.INT,
            propertyId: 1,
            propertyURI: 'test'
        }]
    });

    const EMPTY_DOMAIN = DomainDesign.create({
        name: 'Empty Domain',
    });

    const HAS_SAMPLE_DOMAIN = DomainDesign.create({
        name: 'Basic Domain',
        fields: [{
            name: 'key',
            rangeURI: RANGE_URIS.INT,
            propertyId: 1,
            propertyURI: 'test'
        }, {
            name: 'Sample',
            conceptURI: SAMPLE_TYPE_CONCEPT_URI,
            dataType: SAMPLE_TYPE,
            rangeURI: RANGE_URIS.INT,
            propertyId: 2,
            propertyURI: 'test'
        }]
    });

    const DOMAINS = List([BASE_DOMAIN, EMPTY_DOMAIN]);

    test('Defaults', () => {

        const wrapper = mount(
            <SampleRequiredDomainHeader domain={BASE_DOMAIN} modelDomains={DOMAINS} domainIndex={0}/>
        );

        //Show header, domain has fields and none are Samples
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find(FormControl)).toHaveLength(1);
    });

    test('0 Fields', () => {
        const tree = renderer.create(
            <SampleRequiredDomainHeader domain={EMPTY_DOMAIN} modelDomains={DOMAINS} domainIndex={0}/>
        );

        //Don't show header for empty domain, user hasn't added/inferred any fields yet
        expect(tree.toJSON()).toBeNull();
    });

    test('Has Sample', () => {
        const tree = renderer.create(
            <SampleRequiredDomainHeader domain={HAS_SAMPLE_DOMAIN} modelDomains={List([HAS_SAMPLE_DOMAIN, BASE_DOMAIN, EMPTY_DOMAIN])} domainIndex={0}/>
        );

        //Domain already has Sample field, so header shouldn't show
        expect(tree.toJSON()).toBeNull();
    });
});
