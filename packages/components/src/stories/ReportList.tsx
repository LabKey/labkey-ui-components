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
import React from 'react';
import { storiesOf } from '@storybook/react';
import { createMemoryHistory, Route, Router } from 'react-router';

import data from '../test/data/example_browse_data_tree_api.json';
import './stories.scss';
import { ReportItemModal, ReportList } from '../internal/components/report-list/ReportList';
import { AppURL } from '../url/AppURL';
import { flattenBrowseDataTreeResponse } from '../internal/query/reports';

const history = createMemoryHistory();

const exampleReports = flattenBrowseDataTreeResponse(data, report => {
    const { schemaName, queryName, viewName } = report;

    if (!queryName) {
        return null;
    }

    const parts = ['q', schemaName, queryName];

    if (viewName) {
        parts.push(viewName);
    }

    return AppURL.create(...parts);
});

class ReportListContainer extends React.PureComponent<any, any> {
    constructor(props) {
        super(props);

        this.state = {
            selectedReport: exampleReports[3],
        };
    }

    onReportClicked = report => {
        this.setState(() => {
            return { selectedReport: report };
        });
    };

    onClose = () => {
        this.setState(() => {
            return { selectedReport: null };
        });
    };

    render() {
        const selectedReport = this.state.selectedReport;
        let modal = null;

        if (this.state.selectedReport !== null) {
            modal = <ReportItemModal report={selectedReport} onClose={this.onClose} />;
        }

        return (
            <>
                <ReportList loading={false} reports={exampleReports} onReportClicked={this.onReportClicked} />
                {modal}
            </>
        );
    }
}

storiesOf('ReportList', module)
    .add('No Data', () => {
        return <ReportList loading={false} reports={[]} onReportClicked={() => {}} />;
    })
    .add('With Data', () => {
        const onReportClicked = report => console.log('Report clicked:', report);

        return <ReportList loading={false} reports={exampleReports} onReportClicked={onReportClicked} />;
    })
    .add('Loading', () => {
        return <ReportList loading={true} reports={[]} onReportClicked={() => {}} />;
    })
    .add('With Modal', () => {
        // We have to wrap ReportListContainer in a Router and a Route because if we don't do that React Router Link
        // objects will *not* render any attributes on anchor tags, like hrefs.
        return (
            <Router history={history}>
                <Route path="/" component={ReportListContainer} />
            </Router>
        );
    });
