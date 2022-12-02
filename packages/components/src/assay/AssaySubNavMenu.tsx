/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { Component } from 'react';
import { List } from 'immutable';
import { WithRouterProps } from 'react-router';

import { ASSAYS_KEY } from '../internal/app/constants';
import { AppURL } from '../internal/url/AppURL';

import { ITab } from '../internal/components/navigation/types';
import { SubNav } from '../internal/components/navigation/SubNav';

import { InjectedAssayModel, withAssayModelsFromLocation } from '../internal/components/assay/withAssayModels';

const TABS_WITHOUT_BATCHES = List<string>(['Overview', 'Runs', 'Results']);
const TABS_WITH_BATCHES = TABS_WITHOUT_BATCHES.insert(1, 'Batches');

interface AssaySubNavMenuProps {
    getUrl: (provider: string, protocol: string, text: string) => AppURL;
}

type Props = InjectedAssayModel & WithRouterProps & AssaySubNavMenuProps;

class AssaySubNavMenuImpl extends Component<Props> {
    PARENT_TAB: ITab = {
        text: 'Assays',
        url: AppURL.create(ASSAYS_KEY),
    };

    generateTabs(): List<ITab> {
        const { assayProtocol, params, getUrl } = this.props;
        const { provider, protocol } = params;
        const tabs = assayProtocol?.hasBatchFields ? TABS_WITH_BATCHES : TABS_WITHOUT_BATCHES;
        return tabs
            .map(text => ({
                text,
                url: getUrl(provider, protocol, text),
            }))
            .toList();
    }

    render() {
        return <SubNav noun={this.PARENT_TAB} tabs={this.generateTabs()} />;
    }
}

export const AssaySubNavMenu = withAssayModelsFromLocation(AssaySubNavMenuImpl);
