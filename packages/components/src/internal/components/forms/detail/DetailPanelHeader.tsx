/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';
import { Icon } from '../../../Icon';

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
            <h2 className="panel-heading">
                <span>
                    {verb} {title}
                </span>
                <span className="detail__edit--heading">
                    {warning !== undefined && (
                        <span>
                            <span> - </span>
                            <span className="edit__warning">{warning}</span>
                        </span>
                    )}
                </span>
            </h2>
        );
    }

    return (
        <h2 className="panel-heading">
            <span>{title}</span>
            <span className="detail__edit--heading">
                {isEditable && (
                    <>
                        <button className="clickable-text detail__edit-button" onClick={onClick} type="button">
                            <Icon iconClass="fa fa-pencil-square-o" srText={'Edit ' + title} />
                        </button>
                        <div className="clearfix" />
                    </>
                )}
            </span>
        </h2>
    );
});
DetailPanelHeader.displayName = 'DetailPanelHeader';
