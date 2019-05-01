import mock, { proxy } from 'xhr-mock';
import { fromJS } from 'immutable';

import { initQueryGridState } from "../global";
import { initBrowserHistoryState } from "../util/global";

import mixturesQueryInfo from "../test/data/mixtures-getQueryDetails.json";
import mixtureTypesQueryInfo from "../test/data/mixtureTypes-getQueryDetails.json";
import mixtureTypesQuery from "../test/data/mixtureTypes-getQuery.json";
import mixturesQuery from '../test/data/mixtures-getQuery.json';
import mixturesSelected from '../test/data/mixtures-getSelected.json';
import mixturesReportInfos from '../test/data/mixtures-getReportInfos.json';
import samplesInsert from '../test/data/samples-insertRows.json';
import noDataQuery from '../test/data/noData-getQuery.json';

mock.setup();

mock.get(/.*\/query\/.*\/getQueryDetails.*/, (req, res) => {
    const queryParams = req.url().query;
    let responseBody;
    if (queryParams.schemaName.toLowerCase() === 'exp.data' && queryParams.queryName.toLowerCase() === 'mixtures')
        responseBody = mixturesQueryInfo;
    else if (queryParams.schemaName.toLowerCase() === 'schema' && queryParams.queryName.toLowerCase() === 'gridwithoutdata')
        responseBody = mixturesQueryInfo;
    else if (queryParams.schemaName.toLowerCase() === 'lists' && queryParams.queryName.toLowerCase() === 'mixturetypes')
        responseBody = mixtureTypesQueryInfo;

    return res
        .status(200)
        .headers({'Content-Type': 'application/json'})
        .body(JSON.stringify(responseBody));
});

mock.post(/.*\/query\/.*\/getQuery.*/,  (req, res) => {
    const bodyParams = req.body().toLowerCase();
    let responseBody;
    if (bodyParams.indexOf("&query.queryname=mixtures&") > -1)
        responseBody = mixturesQuery;
    else if (bodyParams.indexOf("&query.queryname=mixturetypes&") > -1)
        responseBody = mixtureTypesQuery;
    else if (bodyParams.indexOf("&query.queryname=gridwithoutdata&") > -1)
        responseBody = noDataQuery;

    return res
        .status(200)
        .headers({'Content-Type': 'application/json'})
        .body(JSON.stringify(responseBody));
});

mock.post(/.*\/query\/.*\/insertRows.*/, {
    status: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(samplesInsert)
});

mock.get(/.*\/query\/.*\/getSelected.*/, {
    status: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(mixturesSelected)
});

mock.get(/.*\/study-reports\/.*\/getReportInfos.*/, {
    status: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(mixturesReportInfos)
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

initBrowserHistoryState();