import { fromJS } from 'immutable';

import { FileColumnRenderer, initNotificationsState, SCHEMAS } from '..';
import { initBrowserHistoryState } from '../internal/util/global';
import { initUnitTests } from '../internal/testHelpers';

import { initMocks } from './mock';

export const disableControls = (): any => ({
    control: { disable: true },
    table: { disable: true },
});

export const initGlobal = (): void => {
    const QUERY_METADATA = fromJS({
        concepts: {
            'http://www.labkey.org/exp/xml#alias': {
                inputRenderer: 'ExperimentAlias',
                columnRenderer: 'AliasRenderer',
                detailRenderer: 'AliasRenderer',
            },
        },
        columnDefaults: {
            flag: {
                removeFromViews: true,
            },
        },
        schema: {
            [SCHEMAS.SAMPLE_SETS.SCHEMA]: {
                columnDefaults: {
                    name: {
                        caption: 'Sample ID',
                        shownInUpdateView: false,
                        shownInDetailsView: false,
                    },
                    run: {
                        shownInDetailsView: false,
                    },
                },
                queryDefaults: {
                    appEditableTable: true,
                },
            },
        },
    });

    const COLUMN_RENDERERS = fromJS({
        filecolumnrenderer: FileColumnRenderer,
    });

    initUnitTests(QUERY_METADATA, COLUMN_RENDERERS);
    initBrowserHistoryState();
    initNotificationsState();
    initMocks();
};
