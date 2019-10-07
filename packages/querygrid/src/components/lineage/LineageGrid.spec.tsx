import * as React from 'react';
import renderer from 'react-test-renderer'
import mock, { proxy } from "xhr-mock";
import { initQueryGridState } from '../../global';
import { LineageGrid } from "./LineageGrid";

import lineageData from '../../test/data/experiment-lineage.json'
import samplesLineageQuery from '../../test/data/sampleLineage-getQuery.json'
import expSystemSamplesLineageQuery from '../../test/data/expSystemSampleLineage-getQuery.json'
import expSystemLineageQuery from '../../test/data/expSystemLineage-getQuery.json'
import sampleSetQueryInfo from '../../test/data/samplesSet-getQueryDetails.json';
import expressionsystemsamplesQueryInfo from '../../test/data/expSystemSamples-getQueryDetails.json'
import expressionsystemQueryInfo from '../../test/data/expSystem-getQueryDetails.json'


beforeAll(() => {
    initQueryGridState();

    mock.setup();

    mock.get(/.*\/query\/getQueryDetails.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;
        let lcSchemaName = queryParams.schemaName.toLowerCase();
        let lcQueryName = queryParams.queryName.toLowerCase();
        if (lcSchemaName === 'samples' && lcQueryName === 'samples')
            responseBody = sampleSetQueryInfo;
        else if (lcSchemaName === 'samples' && lcQueryName === 'expressionsystemsamples')
            responseBody = expressionsystemsamplesQueryInfo;
        else if (lcSchemaName === 'exp.data' && lcQueryName === 'expressionsystem')
            responseBody = expressionsystemQueryInfo;

        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody));
    });

    mock.post(/.*\/query\/getQuery.*/,  (req, res) => {
        const bodyParams = req.body().toLowerCase();
        let responseBody;
        if (bodyParams.indexOf("&query.queryname=samples&") > -1 && bodyParams.indexOf("&query.rowid~in=") > -1)
            responseBody = samplesLineageQuery;
        else if (bodyParams.indexOf("&query.queryname=expressionsystemsamples&") > -1 && bodyParams.indexOf("&query.rowid~in=") > -1)
            responseBody = expSystemSamplesLineageQuery;
        else if (bodyParams.indexOf("&schemaname=exp.data&") > -1 && bodyParams.indexOf("&query.queryname=expressionsystem&") > -1)
            responseBody = expSystemLineageQuery;

        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody));
    });

    mock.get(/.*lineage.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;
        if (queryParams.lsid.indexOf('ES-1.2') > -1) {
            responseBody = lineageData;
        }

        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody));
    });

    mock.use(proxy);
});

afterAll(() => {
    mock.reset();
});

describe("<LineageGrid/>", () => {

    test("loading", () => {
        const component = renderer.create(
            <LineageGrid lsid={'urn:lsid:labkey.com:Sample.9273.ExpressionSystemSamples:ES-1.2'}/>
        );

        expect(component.toJSON()).toMatchSnapshot();
    });

    test("with data", done => {
        const component = renderer.create(
            <LineageGrid lsid={'urn:lsid:labkey.com:Sample.9273.ExpressionSystemSamples:ES-1.2'}/>
        );

        setTimeout(() => {
            expect(component.toJSON()).toMatchSnapshot();
            done();
        });
    });

});