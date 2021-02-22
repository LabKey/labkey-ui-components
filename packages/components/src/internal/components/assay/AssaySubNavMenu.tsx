/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { Component } from 'react';
import { List } from 'immutable';
import { WithRouterProps } from 'react-router';
import { App, AppURL, InjectedAssayModel, ITab, SubNav, withAssayModelsFromLocation } from '../../..';

const BATCHES_TAB = 'Batches';
const TABS_WITHOUT_BATCHES = List<string>(['Overview', 'Runs', 'Results']);

interface AssaySubNavMenuProps {
    getUrl: (provider: string, protocol: string, text: string) => AppURL
}

type Props = InjectedAssayModel & WithRouterProps & AssaySubNavMenuProps;

export class AssaySubNavMenuImpl extends Component<Props> {

    PARENT_TAB: ITab = {
        text: 'Assays',
        url: AppURL.create(App.ASSAYS_KEY)
    };

    generateTabs(): List<ITab> {
        const { assayProtocol, params, getUrl } = this.props;
        const { provider, protocol } = params;

        let tabs = TABS_WITHOUT_BATCHES;
        if (assayProtocol) {
            // only show the batch domain if it is already populated (i.e. has at least one field)
            const batchDomain = assayProtocol.getDomainByNameSuffix('Batch');
            if (batchDomain?.fields.size > 0) {
                tabs = tabs.insert(1, BATCHES_TAB);
            }
        }
        return tabs.map(text => ({
            text,
            url: getUrl(provider, protocol, text)
        })).toList();
    }

    render() {
        return <SubNav noun={this.PARENT_TAB} tabs={this.generateTabs()} />;
    }
}

export const AssaySubNavMenu = withAssayModelsFromLocation(AssaySubNavMenuImpl);
