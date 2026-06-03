/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { Icon } from '../../Icon';

interface RemoveEntityButtonProps {
    entity?: string;
    index?: number;
    labelClass?: string;
    onClick: () => void;
}

export class RemoveEntityButton extends React.Component<RemoveEntityButtonProps, any> {
    static defaultProps = {
        labelClass: 'col-sm-3 control-label text-left',
    };

    render() {
        const { entity, index, labelClass, onClick } = this.props;
        const buttonText = entity ? ' Remove ' + entity + ' ' + (index || '') : '';
        return (
            <div className={labelClass}>
                <button aria-label={entity ? buttonText : 'Remove'} className="clickable-text container--action-button" onClick={onClick} type="button">
                    <span className="fa fa-times container--removal-icon" aria-hidden="true" />
                    {buttonText}
                </button>
            </div>
        );
    }
}
