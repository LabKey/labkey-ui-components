/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { fromJS } from 'immutable';

import { FileColumnRenderer, initNotificationsState, SCHEMAS } from '..';
import { initBrowserHistoryState } from '../internal/util/global';
import { initUnitTests } from '../internal/testHelpers';

import { initMocks } from './mock';

const initGlobal = (): void => {
    const QUERY_METADATA = fromJS({
        // hideEmptyChartSelector: true,
        // hideEmptyViewSelector: true,
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

export default initGlobal;
