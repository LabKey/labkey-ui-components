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
import * as React from 'react';
import {LabelHelpTip} from "../LabelHelpTip";

interface AddEntityButtonProps {
    buttonClass?: string
    containerClass?: string
    entity?: string
    onClick: () => void
    helperTitle?:string
    helperBody?: any
}

export class AddEntityButton extends React.Component<AddEntityButtonProps, any> {

    static defaultProps = {
        containerClass: 'form-group',
        helperTitle: 'More Info',
    };

    render() {
        const { buttonClass, containerClass, entity, onClick, helperBody, helperTitle } = this.props;

        return (
            <div className={containerClass}>
                <div className={buttonClass}>
                    <span className="container--action-button" onClick={onClick}>
                        <i className="fa fa-plus-circle container--addition-icon"/> Add {entity}
                    </span>
                    {helperBody ? <LabelHelpTip body={helperBody} title={helperTitle}/> : '' }
                </div>
            </div>
        );
    }
}