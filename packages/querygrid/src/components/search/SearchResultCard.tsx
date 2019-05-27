/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import {SVGIcon, SCHEMAS} from "@glass/base";

interface SearchResultProps {
    title: string
    summary: string
    url: string
    data?: any
}

export class SearchResultCard extends React.Component<SearchResultProps, any> {

    resolveType() {
        const { data } = this.props;

        let typeName;
        if (data) {
            if (data.getIn(['dataClass', 'name'])) {
                typeName = data.getIn(['dataClass', 'name']);
            }
            else if (data.getIn(['sampleSet', 'name'])) {
                typeName = data.getIn(['sampleSet', 'name']);
            }

            if (typeName) {
                return (
                    <div>
                        <strong>Type: </strong>
                        {typeName}
                    </div>
                )
            }
        }
    }

    resolveImage() {
        const { data } = this.props;

        let iconSrc = '';

        if (data) {
            if (data.getIn(['dataClass', 'name'])) {
                iconSrc = data.getIn(['dataClass', 'name']).toLowerCase();
            }
            else if (data.getIn(['sampleSet', 'name'])) {
                const sampleSetName = data.getIn(['sampleSet', 'name']).toLowerCase();

                switch (sampleSetName) {
                    case SCHEMAS.SAMPLE_SETS.RAW_MATERIALS.queryName.toLowerCase():
                        iconSrc = 'ingredients';
                        break;
                    case SCHEMAS.SAMPLE_SETS.MIXTURE_BATCHES.queryName.toLowerCase():
                        iconSrc = 'batch';
                        break;
                    default:
                        iconSrc = 'samples';
                        break;
                }
            }
            else if (data.get('type')) {
                iconSrc=data.get('type').toLowerCase();
            }
        }

        return <SVGIcon
            iconDir={'_images'}
            iconSrc={iconSrc}
            className="search-result__card-icon"/>
    }

    render () {
        const { title, summary, url } = this.props;

        return (
            <a href={url}>
                <div className="row search-result__card-container">
                    <div className="col-md-2 hidden-sm hidden-xs search-result__card-icon__container">
                        {this.resolveImage()}
                    </div>
                    <div className="col-md-10 col-sm-12">
                        <div>
                            <h4 className="text-capitalize">
                                {title}
                            </h4>
                        </div>
                        {this.resolveType()}
                        <div title={summary}>
                            <strong>Summary: </strong> {summary.length ? ( summary.length <= 35 ? summary : summary.substr(0, 35) + "..." ): 'No summary provided'}
                        </div>
                    </div>
                </div>
            </a>
        )
    }
}
