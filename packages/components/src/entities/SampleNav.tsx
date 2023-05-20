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
    getProjectDataExclusion,
    isAssayEnabled,
    isWorkflowEnabled,
    userCanReadAssays,
    userCanReadDataClasses,
} from '../internal/app/utils';

import { SubNav } from '../internal/components/navigation/SubNav';

import { loadSampleTypes } from './actions';

export const SampleIndexNav: FC<WithRouterProps> = memo(({ params }) => {
    const { id, sampleType } = params;
    const [noun, setNoun] = useState<ITab>();
    const { moduleContext, user } = useServerContext();

    useEffect(() => {
        (async () => {
            const queryInfo = await getQueryDetails({ schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA, queryName: sampleType });
            setNoun({
                text: queryInfo?.title ?? '',
                url: AppURL.create(SAMPLES_KEY, sampleType),
            });
        })();
    }, [sampleType]);

    const tabs: List<ITab> = useMemo(() => {
        const tabText = ['Overview'];
        if (userCanReadDataClasses(user)) tabText.push('Lineage');
        tabText.push('Aliquots');
        if (userCanReadAssays(user) && isAssayEnabled(moduleContext)) tabText.push('Assays');
        if (isWorkflowEnabled(moduleContext)) tabText.push('Jobs');
        tabText.push('Timeline');

        return tabText.reduce((tabs_, text) => {
            const parts = [SAMPLES_KEY, sampleType, id];
            if (text !== 'Overview') {
                parts.push(text.toLowerCase());
            }
            return tabs_.push({ text, url: AppURL.create(...parts) });
        }, List<ITab>());
    }, [id, moduleContext, sampleType, user]);

    return <SubNav noun={noun} tabs={tabs} />;
});

export const SampleTypeIndexNav: FC<WithRouterProps> = memo(location => {
    const [tabs, setTabs] = useState<List<ITab>>(() => List());
    const noun = useMemo(() => ({ text: 'Samples', url: AppURL.create(SAMPLES_KEY) }), []);
    const { moduleContext } = useServerContext();
    const dataTypeExclusions = getProjectDataExclusion(moduleContext);

    useEffect(() => {
        (async () => {
            const allSampleTypes = await loadSampleTypes(
                false /* don't include media here since it is showing only in the sample type landing pages */,
                dataTypeExclusions?.['SampleType']
            );
            const tabs_ = allSampleTypes
                .sort(naturalSortByProperty('title'))
                .map(queryInfo => ({ text: queryInfo.title, url: AppURL.create(SAMPLES_KEY, queryInfo.name) }));
            setTabs(List(tabs_));
        })();
    }, [location, moduleContext]);

    return <SubNav noun={noun} tabs={tabs} />;
});
