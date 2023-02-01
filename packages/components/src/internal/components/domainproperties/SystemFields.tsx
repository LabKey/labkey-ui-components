import React, { FC, memo, useCallback, useState } from 'react';

import classNames from 'classnames';

import { Grid } from '../base/Grid';
import { SystemField } from '../samples/models';

interface Props {
    systemFields: SystemField[];
}

export const SystemFields: FC<Props> = memo(({ systemFields }) => {
    const [collapsed, setCollapsed] = useState<boolean>(false);

    const onToggle = useCallback(() => {
        setCollapsed(!collapsed);
    }, [collapsed]);

    return (
        <>
            <div className="domain-system-fields">
                <div className="domain-system-fields-header">
                    <div className="domain-system-fields-header__icon" onClick={onToggle}>
                        <i className={classNames('fa fa-lg', collapsed ? 'fa-plus-square' : 'fa-minus-square')} />
                    </div>
                    <div className="domain-system-fields-header__text" onClick={onToggle}>
                        Default System Fields
                    </div>
                </div>

                {!collapsed && (
                    <div className="domain-system-fields__grid">
                        <Grid data={systemFields} condensed={true} />
                    </div>
                )}
            </div>
            <div className="domain-custom-fields-header__text"> Custom Fields </div>
        </>
    );
});
