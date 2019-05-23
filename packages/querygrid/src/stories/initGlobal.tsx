import { fromJS } from 'immutable';
import { initNotificationsState, SCHEMAS } from "@glass/base";

import { initQueryGridState } from "../global";
import { initBrowserHistoryState } from "../util/global";
import { initMocks } from "./mock";

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
    },
    schema: {
        [SCHEMAS.SAMPLE_SETS.SCHEMA]: {
            columnDefaults: {
                name: {
                    caption: 'Sample ID',
                    shownInUpdateView: false
                }
            },
            queryDefaults: {
                appEditableTable: true
            }
        }
    }
}));

initBrowserHistoryState();
initNotificationsState();

initMocks();