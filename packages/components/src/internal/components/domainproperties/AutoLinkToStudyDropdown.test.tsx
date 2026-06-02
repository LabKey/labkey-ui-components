/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { List } from 'immutable';

import { render } from '@testing-library/react';

import getValidPublishTargetsJson from '../../../test/data/assay-getValidPublishTargets.json';

import { Container } from '../base/models/Container';

import { AutoLinkToStudyDropdown } from './AutoLinkToStudyDropdown';

const CONTAINERS = List(getValidPublishTargetsJson.containers.map(c => new Container(c)));
const BASE_PROPS = {
    value: '5B75A3A6-FAED-1035-9558-2CC2863E7240',
    autoLinkTarget: 'autoLinkTargetFormId',
    onChange: jest.fn,
};

describe('<AutoLinkToStudyDropdown/>', () => {
    test('default props', async () => {
        render(<AutoLinkToStudyDropdown {...BASE_PROPS} containers={CONTAINERS} />);

        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(0);
        expect(document.querySelectorAll('option')).toHaveLength(8);
    });

    test('loading', async () => {
        render(<AutoLinkToStudyDropdown {...BASE_PROPS} containers={undefined} />);

        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(1);
        expect(document.querySelectorAll('option')).toHaveLength(0);
    });
});
