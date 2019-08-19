import mock, { proxy } from 'xhr-mock';

import mixturesQueryInfo from '../../../querygrid/src/test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../../../querygrid/src/test/data/mixtures-getQuery.json';

export function initMocks() {
    mock.setup();

    mock.get(/.*\/query\/.*\/getQueryDetails.*/, (req, res) => {
        const queryParams = req.url().query;
        let responseBody;
        let lcSchemaName = queryParams.schemaName.toLowerCase();
        let lcQueryName = queryParams.queryName.toLowerCase();

        if (lcSchemaName === 'exp.data' && lcQueryName === 'mixtures') {
            responseBody = mixturesQueryInfo;
        }

        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody));
    });

    mock.post(/.*\/query\/.*\/getQuery.*/,  (req, res) => {
        const bodyParams = req.body().toLowerCase();
        let responseBody;

        if (bodyParams.indexOf("&query.queryname=mixtures&") > -1) {
            responseBody = mixturesQuery;
        }

        return res
            .status(200)
            .headers({'Content-Type': 'application/json'})
            .body(JSON.stringify(responseBody));
    });

    mock.use(proxy);
}

initMocks();
