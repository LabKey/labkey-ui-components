import React from 'react'
import { List } from "immutable";
import renderer from 'react-test-renderer'
import {RANGE_URIS, DomainDesign, SAMPLE_TYPE, SAMPLE_TYPE_CONCEPT_URI} from "@labkey/components";
import {SampleRequiredDomainHeader} from "./SampleRequiredDomainHeader";

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

        const tree = renderer.create(
            <SampleRequiredDomainHeader domain={BASE_DOMAIN} modelDomains={DOMAINS} domainIndex={0}/>
        );

        //Show header, domain has fields and none are Samples
        expect(tree.toJSON()).toMatchSnapshot();
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