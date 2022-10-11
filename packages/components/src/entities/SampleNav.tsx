/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useEffect, useMemo, useState } from 'react';
import { List } from 'immutable';
import { WithRouterProps } from 'react-router';

import { useServerContext } from '../internal/components/base/ServerContext';
import { ITab } from '../internal/components/navigation/types';
import { SCHEMAS } from '../internal/schemas';
import { getQueryDetails } from '../internal/query/api';
import { AppURL } from '../internal/url/AppURL';
import { SAMPLES_KEY } from '../internal/app/constants';
import { naturalSortByProperty } from '../public/sort';
import {
    isAssayEnabled,
    isMediaEnabled,
    isWorkflowEnabled,
    userCanReadAssays,
    userCanReadDataClasses,
} from '../internal/app/utils';

import { SubNav } from '../internal/components/navigation/SubNav';

import { loadSampleTypes } from './actions';

export const SampleTypeDetailsNav: FC<WithRouterProps> = memo(({ params }) => {
    const { id, sampleSet } = params;
    const [noun, setNoun] = useState<ITab>();
    const { user } = useServerContext();

    useEffect(() => {
        (async () => {
            const queryInfo = await getQueryDetails({ schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA, queryName: sampleSet });
            setNoun({
                text: queryInfo?.title ?? '',
                url: AppURL.create(SAMPLES_KEY, sampleSet),
            });
        })();
    }, [sampleSet]);

    const tabText = ['Overview'];
    if (userCanReadDataClasses(user)) tabText.push('Lineage');
    tabText.push('Aliquots');
    if (userCanReadAssays(user) && isAssayEnabled()) tabText.push('Assays');
    if (isWorkflowEnabled()) tabText.push('Jobs');
    tabText.push('Timeline');

    const tabs = useMemo(
        () =>
            tabText.reduce((tabs, text) => {
                const parts = [SAMPLES_KEY, sampleSet, id];
                if (text !== 'Overview') {
                    parts.push(text.toLowerCase());
                }
                return tabs.push({ text, url: AppURL.create(...parts) });
            }, List<ITab>()),
        [id, sampleSet]
    );

    return <SubNav noun={noun} tabs={tabs} />;
});

export const SampleIndexNav: FC<WithRouterProps> = memo(location => {
    const [tabs, setTabs] = useState<List<ITab>>(() => List());
    const noun = useMemo(() => ({ text: 'Samples', url: AppURL.create(SAMPLES_KEY) }), []);
    const { moduleContext } = useServerContext();

    useEffect(() => {
        (async () => {
            const includeMedia = isMediaEnabled(moduleContext);
            const allSampleTypes = await loadSampleTypes(includeMedia);
            const tabs_ = allSampleTypes
                .filter(qi => !qi.isMedia)
                .sort(naturalSortByProperty('title'))
                .map(queryInfo => ({
                    text: queryInfo.title,
                    url: AppURL.create(SAMPLES_KEY, queryInfo.name),
                }));
            setTabs(List(tabs_));
        })();
    }, [location, moduleContext]);

    return <SubNav noun={noun} tabs={tabs} />;
});
