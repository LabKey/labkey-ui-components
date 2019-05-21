import mock, { proxy } from 'xhr-mock';
import { fromJS } from 'immutable';


import { initNotificationsState } from "@glass/base";

import nameExpressionQuery from "../test/data/nameExpr-getQuery.json";
import sampleSetsQuery from "../test/data/sampleSets-getQuery.json";
import sampleSetsQueryInfo from "../test/data/sampleSets-getQueryDetails.json";
import { initQueryGridState } from '@glass/querygrid';

mock.setup();

mock.get(/.*\/query\/.*\/getQueryDetails.*/, (req, res) => {
    const queryParams = req.url().query;
    let responseBody;
    if (queryParams.schemaName.toLowerCase() === 'exp' && queryParams.queryName.toLowerCase() === 'samplesets')
        responseBody = sampleSetsQueryInfo;
    else if (queryParams.schemaName.toLowerCase() === 'samples' && queryParams.queryName.toLowerCase() === 'name expression set')
        responseBody = nameExpressionQuery;

    return res
        .status(200)
        .headers({'Content-Type': 'application/json'})
        .body(JSON.stringify(responseBody));
});


mock.post(/.*\/query\/.*\/getQuery.*/,  (req, res) => {
    const bodyParams = req.body().toLowerCase();
    let responseBody;
    if (bodyParams.indexOf("&query.queryname=samplesets&") > -1)
        responseBody = sampleSetsQuery;

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