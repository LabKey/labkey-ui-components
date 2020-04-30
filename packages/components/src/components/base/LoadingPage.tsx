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

import { Page } from './Page';
import { PageHeader } from './PageHeader';
import { LoadingSpinner } from './LoadingSpinner';

export interface LoadingPageProps {
    title?: string;
    msg?: string;
}

export class LoadingPage extends React.Component<LoadingPageProps> {
    render() {
        return (
            <Page title={this.props.title} hasHeader={true}>
                <PageHeader showNotifications={false} />
                <LoadingSpinner msg={this.props.msg} wrapperClassName="loading-page-message" />
            </Page>
        );
    }
}
