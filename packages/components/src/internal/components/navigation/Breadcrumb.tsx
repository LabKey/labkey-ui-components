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
import React, { FC, ReactNode } from 'react';
import classNames from 'classnames';

interface Props {
    className?: string;
}

export const Breadcrumb: FC<Props> = props => {
    const children: ReactNode[] = [];
    React.Children.forEach(props.children, c => {
        if (c !== null) {
            children.push(c);
        }
    });

    if (children.length === 0) {
        return null;
    }

    return (
        <ol className={classNames('breadcrumb', props.className)}>
            {React.Children.map(children, (child, i) => {
                return (
                    <>
                        {i > 0 && <li className="separator">&nbsp;/&nbsp;</li>}
                        <li>{child}</li>
                    </>
                );
            })}
        </ol>
    );
};

Breadcrumb.displayName = 'Breadcrumb';
