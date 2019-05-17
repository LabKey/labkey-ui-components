/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'

interface DetailPanelHeaderProps {
    isEditable: boolean
    canUpdate: boolean
    editing?: boolean
    onClickFn?: () => void
    title?: string
    warning?: string
    useEditIcon: boolean
}

export class DetailPanelHeader extends React.Component<DetailPanelHeaderProps, any> {

    static defaultProps = {
        title: 'Details',
        useEditIcon: true
    };

    render() {
        const { isEditable, canUpdate, editing, onClickFn, warning, title, useEditIcon } = this.props;

        if (editing) {
            return (
                <div className="detail__edit--heading">
                    Editing {title}
                    {warning !== undefined && (
                        <span>
                            <span> - </span>
                            <span className="edit__warning">{warning}</span>
                        </span>
                    )}
                </div>
            )
        }

        return (
            <div className="detail__edit--heading">
                {title}
                {isEditable && canUpdate && (
                    <>
                        <div className="detail__edit-button" onClick={onClickFn}>
                            {useEditIcon ? <i className="fa fa-pencil-square-o"/> : 'Edit'}
                        </div>
                        <div className="clearfix"/>
                    </>
                )}
            </div>
        )
    }
}