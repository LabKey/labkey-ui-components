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
import { Panel } from 'react-bootstrap';

import { SearchResultsModel } from './models';
import { SearchResultCard } from './SearchResultCard';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { helpLinkNode, SEARCH_SYNTAX_TOPIC } from '../../util/helpLinks';

interface Props {
    model: SearchResultsModel
    iconUrl?: string
    useSampleType?: boolean   // Hack to update "Sample Set" --> "Sample Type" for Sample Manager, but not other apps
}

export class SearchResultsPanel extends React.Component<Props, any> {

    isLoading(): boolean {
        const { model } = this.props;
        return model ? model.get('isLoading') : false;
    }

    renderLoading() {
        if (this.isLoading()) {
            return <LoadingSpinner wrapperClassName="search-results__margin-top"/>
        }
    }

    renderError() {
        const { model } = this.props;
        const error = model ? model.get('error') : undefined;

        if (!this.isLoading() && error) {
            console.error(error);
            return <Alert>
                There was an error with your search term(s).
                See the {helpLinkNode(SEARCH_SYNTAX_TOPIC, "LabKey Search Documentation")} page
                for more information on search terms and operators.
            </Alert>
        }
    }

    renderResults() {
        const { model, iconUrl, useSampleType } = this.props;
        const results = model ? model.getIn(['entities', 'hits']) : undefined;

        if (!this.isLoading() && results !== undefined) {
            // result.has('data') is <=20.1 compatible way to check for sample search results TODO remove post 20.1
            const data = results.filter((result) => {
                const category = result.get('category');
                return category=='data' || category=='material' || category=='workflowJob' || category=='file workflowJob' || result.has('data');
            });

            if (data.size > 0) {
                return (
                    <div>
                        <h3 className="no-margin-top search-results__amount">{data.size} Results</h3>
                        {data.size > 0 && data.map((item, i) => (
                            <div key={i} className="col-md-6 col-sm-12 search-results__margin-top">
                                <SearchResultCard
                                    title={item.get('title')}
                                    summary={item.get('summary')}
                                    url={item.get('url')}
                                    category={item.get('category')}
                                    data={item.get('data')}
                                    iconUrl={iconUrl}
                                    useSampleType={useSampleType}
                                />
                            </div>
                        ))}
                    </div>
                )
            }
            else {
                return (
                    <div className="search-results__margin-top">
                        No Results Found
                    </div>
                )
            }
        }
    }

    render() {
        return (
            <Panel>
                <Panel.Body>
                    {this.renderLoading()}
                    {this.renderError()}
                    {this.renderResults()}
                </Panel.Body>
            </Panel>
        )
    }
}
