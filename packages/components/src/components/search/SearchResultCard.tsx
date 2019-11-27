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
import * as React from 'react'
import { SCHEMAS } from '../base/models/schemas';
import { SVGIcon } from '../base/SVGIcon';

interface SearchResultProps {
    category?: string
    title: string
    summary: string
    url: string
    data?: any
    iconUrl?: string
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
        const { category, data, iconUrl } = this.props;

        if (iconUrl) {
            return <img className="search-result__card-icon" src={iconUrl}/>
        }

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
            else if (data.get('type') === 'sampleSet') {
                iconSrc = 'sample_set';
            }
            else if (data.get('type')) {
                iconSrc=data.get('type').toLowerCase();
            }
        }
        if (!iconSrc && category) {
            switch (category)
            {
                case 'workflowJob':
                    iconSrc = 'workflow';
                    break;
                case 'material':
                    iconSrc = 'samples';
                    break;
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
