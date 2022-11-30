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

interface DetailPanelHeaderProps {
    canUpdate: boolean;
    editing?: boolean;
    isEditable: boolean;
    onClickFn?: () => void;
    title?: string;
    useEditIcon: boolean;
    verb?: string;
    warning?: string;
}

export class DetailPanelHeader extends React.Component<DetailPanelHeaderProps, any> {
    static defaultProps = {
        title: 'Details',
        useEditIcon: true,
        verb: 'Editing',
    };

    render() {
        const { isEditable, canUpdate, editing, onClickFn, warning, title, useEditIcon, verb } = this.props;

        if (editing) {
            return (
                <>
                    {verb} {title}
                    <span className="detail__edit--heading">
                        {warning !== undefined && (
                            <span>
                                <span> - </span>
                                <span className="edit__warning">{warning}</span>
                            </span>
                        )}
                    </span>
                </>
            );
        }

        return (
            <>
                {title}
                <span className="detail__edit--heading">
                    {isEditable && canUpdate && (
                        <>
                            <div className="detail__edit-button" onClick={onClickFn}>
                                {useEditIcon ? <i className="fa fa-pencil-square-o" /> : 'Edit'}
                            </div>
                            <div className="clearfix" />
                        </>
                    )}
                </span>
            </>
        );
    }
}
