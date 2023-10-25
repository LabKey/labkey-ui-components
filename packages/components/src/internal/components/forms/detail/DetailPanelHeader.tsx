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
import React, { FC, memo } from 'react';

interface DetailPanelHeaderProps {
    editing?: boolean;
    isEditable: boolean;
    onClick?: () => void;
    title?: string;
    verb?: string;
    warning?: string;
}

export const DetailPanelHeader: FC<DetailPanelHeaderProps> = memo(props => {
    const { isEditable, editing, onClick, warning, title = 'Details', verb = 'Editing' } = props;

    if (editing) {
        return (
            <div className="panel-heading">
                {verb} {title}
                <span className="detail__edit--heading">
                    {warning !== undefined && (
                        <span>
                            <span> - </span>
                            <span className="edit__warning">{warning}</span>
                        </span>
                    )}
                </span>
            </div>
        );
    }

    return (
        <div className="panel-heading">
            {title}
            <span className="detail__edit--heading">
                {isEditable && (
                    <>
                        <div className="detail__edit-button" onClick={onClick}>
                            <i className="fa fa-pencil-square-o" />
                        </div>
                        <div className="clearfix" />
                    </>
                )}
            </span>
        </div>
    );
});
DetailPanelHeader.displayName = 'DetailPanelHeader';
