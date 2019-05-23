import mock, { proxy } from 'xhr-mock';
import { fromJS } from 'immutable';


import { initNotificationsState } from "@glass/base";

import nameExpressionQueryInfo from "../test/data/nameExpressionSet-getQueryDetails.json";
import nameExpressionSelected from "../test/data/nameExpressionSet-getSelected.json";
import nameExpressionSelectedQuery from "../test/data/nameExpressionSet-selected-getQuery.json";
import sampleSet2QueryInfo from "../test/data/sampleSet2-getQueryDetails.json";
import sampleSetsQuery from "../test/data/sampleSets-getQuery.json";
import sampleSetsQueryInfo from "../test/data/sampleSets-getQueryDetails.json";
import { initQueryGridState } from '@glass/querygrid';

mock.setup();

mock.get(/.*\/query\/.*\/getQueryDetails.*/, (req, res) => {
    const queryParams = req.url().query;
    let responseBody;
    let lcSchemaName = queryParams.schemaName.toLowerCase();
    let lcQueryName = queryParams.queryName.toLowerCase();
    if (lcSchemaName === 'exp' && lcQueryName === 'samplesets')
        responseBody = sampleSetsQueryInfo;
    else if (lcSchemaName === 'samples' && (lcQueryName === 'name expression set' || lcQueryName === 'name%20expression%20set'))
        responseBody = nameExpressionQueryInfo;
    else if (lcSchemaName === 'samples' && lcQueryName === 'sample set 2')
        responseBody = sampleSet2QueryInfo;

    return res
        .status(200)
        .headers({'Content-Type': 'application/json'})
        .body(JSON.stringify(responseBody));
});


mock.post(/.*\/query\/.*\/getQuery.*/,  (req, res) => {
    const bodyParams = req.body().toLowerCase();
    let responseBody;
    // dataregionname=query&query.queryname=name%2520expression%2520set&schemaname=samples&query.rowid~in=450&query.columns=*&apiversion=17.1
    if (bodyParams.indexOf("&query.queryname=samplesets&") > -1)
        responseBody = sampleSetsQuery;
    else if (bodyParams.indexOf("&query.queryname=name%2520expression%2520set") > -1 && bodyParams.indexOf("&query.rowid~in=459") > -1)
        responseBody = nameExpressionSelectedQuery;

    return res
        .status(200)
        .headers({'Content-Type': 'application/json'})
        .body(JSON.stringify(responseBody));
});

mock.get(/.*\/query\/.*\/getSelected.*/, (req, res) => {
    const queryParams = req.url().query;
    let responseBody;
    if (queryParams.key.toLowerCase() === "sample-set-name%20expression%20set|samples/name%20expression%20set")
        responseBody = nameExpressionSelected;

    return res
        .status(200)
        .headers({'Content-Type': 'application/json'})
        .body(JSON.stringify(responseBody));
});


mock.use(proxy);

initQueryGridState(fromJS({
    concepts: {
        'http://www.labkey.org/exp/xml#alias': {
            inputRenderer: 'ExperimentAlias',
            columnRenderer: 'AliasRenderer',
            detailRenderer: 'AliasRenderer'
        }
    },
    columnDefaults: {
        flag: {
            removeFromViews: true
        }
    }
}));

initNotificationsState();