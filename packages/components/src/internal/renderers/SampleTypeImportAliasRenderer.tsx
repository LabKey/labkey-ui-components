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
import React, { PureComponent, FC, memo, ReactNode } from 'react';
import { Map } from 'immutable';

import { AppURL } from '../url/AppURL';
import { SAMPLES_KEY, SOURCES_KEY } from '../app/constants';

interface Props {
    data: Map<any, any>;
}

export class SampleTypeImportAliasRenderer extends PureComponent<Props> {
    render(): ReactNode {
        return <ImportAliasRenderer type={SAMPLES_KEY} data={this.props.data} />;
    }
}

export class SourceTypeImportAliasRenderer extends PureComponent<Props> {
    render(): ReactNode {
        return <ImportAliasRenderer type={SOURCES_KEY} data={this.props.data} />;
    }
}

interface RendererProps extends Props {
    type: string;
}

const ImportAliasRenderer: FC<RendererProps> = memo(props => {
    const { type, data } = props;
    const aliasMap = data?.get('displayValue');

    return (
        <>
            {aliasMap?.keySeq().map((key, index) => {
                return (
                    <>
                        {index > 0 && <span>, </span>}
                        <a key={key} href={AppURL.create(type, aliasMap.get(key)).toHref()}>{key}</a>
                    </>
                );
            })}
        </>
    );
});
