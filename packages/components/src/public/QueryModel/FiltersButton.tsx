/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';

import { Tip } from '../../internal/components/base/Tip';
import { Icon } from '../../internal/Icon';

interface Props {
    iconOnly?: boolean;
    onFilter: () => void;
}

export const FiltersButton: FC<Props> = memo(props => {
    const { onFilter, iconOnly } = props;

    if (iconOnly) {
        return (
            <Tip caption="Filters">
                <button className="grid-panel__button btn btn-default" onClick={onFilter} type="button">
                    <Icon iconClass="fa fa-filter" srText="Filters" />
                </button>
            </Tip>
        );
    }

    return (
        <button className="grid-panel__button btn btn-default" onClick={onFilter} type="button">
            <span aria-hidden="true" className="fa fa-filter" /> Filters
        </button>
    );
});
FiltersButton.displayName = 'FiltersButton';
