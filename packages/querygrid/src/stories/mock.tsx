import mock, { proxy } from 'xhr-mock';

import mixtureBatchesQueryInfo from "../test/data/mixtureBatches-getQueryDetails.json";
import mixtureTypesQuery from "../test/data/mixtureTypes-getQuery.json";
import mixturesQuery from '../test/data/mixtures-getQuery.json';
import mixturesSelected from '../test/data/mixtures-getSelected.json';
import mixturesReportInfos from '../test/data/mixtures-getReportInfos.json';
import samplesInsert from '../test/data/samples-insertRows.json';

mock.setup();

mock.get(/.*\/query\/.*\/getQueryDetails.*/, {
    status: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(mixtureBatchesQueryInfo)
});

mock.post(/.*\/query\/.*\/getQuery.*/, {
    status: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(mixtureTypesQuery)
});

// TODO how to match on different query requests?
// mock.post(/.*\/query\/.*\/getQuery.*/, {
//     status: 200,
//     headers: {'Content-Type': 'application/json'},
//     body: JSON.stringify(mixturesQuery)
// });

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