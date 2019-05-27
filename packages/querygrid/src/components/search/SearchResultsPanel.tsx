/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { Panel } from "react-bootstrap";
import { Alert, LoadingSpinner } from "@glass/base";

import { SearchResultsModel } from "../../model";
import { SearchResultCard } from "./SearchResultCard";


interface Props {
    model: SearchResultsModel
}

export class SearchResultsPanel extends React.Component<Props, any> {

    renderLoading() {
        const { model } = this.props;
        const isLoading = model ? model.get('isLoading') : false;

        if (isLoading) {
            return <LoadingSpinner wrapperClassName="search-results__margin-top"/>
        }
    }

    renderError() {
        const { model } = this.props;
        const error = model ? model.get('error') : undefined;

        if (error) {
            return <Alert>{error}</Alert>
        }
    }

    renderResults() {
        const { model } = this.props;
        const results = model ? model.getIn(['entities', 'hits']) : undefined;

        if (results !== undefined) {
            const data = results.filter((result) => result.has('data'));

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
                                    data={item.get('data')}/>
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