/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback } from 'react';
import classNames from 'classnames';
import { useEnterEscape } from '../../../public/useEnterEscape';

interface Props {
    cls?: string;
    collapsedTitle: string;
    expanded: boolean;
    expandedTitle: string;
    highlighted?: boolean;
    id: string;
    onClick: () => void;
}

export const FieldExpansionToggle: FC<Props> = props => {
    const { expanded, expandedTitle, collapsedTitle, cls, highlighted, id, onClick } = props;
    const className = classNames('fa fa-lg', {
        'field-highlighted': highlighted && !expanded,
        'fa-chevron-down': expanded,
        'fa-chevron-right': !expanded,
    });
    const onClickHandler = useCallback(() => {
        onClick();
    }, [onClick]);
    const onKeyDown = useEnterEscape(onClickHandler);

    return (
        <div
            className={'field-icon ' + (cls ? cls : '')}
            id={id}
            onClick={onClickHandler}
            onKeyDown={onKeyDown}
            tabIndex={0}
            title={expanded ? expandedTitle : collapsedTitle}
        >
            <span className={className} />
        </div>
    );
};
FieldExpansionToggle.displayName = 'FieldExpansionToggle';
