import React, { FC, memo, useCallback, useState } from 'react';

import classNames from 'classnames';

import { Collapse } from 'react-bootstrap';

import { Grid } from '../base/Grid';

import { SystemField } from './models';
import { EXPAND_TRANSITION } from './constants';

interface Props {
    fields: SystemField[];
}

export const SystemFields: FC<Props> = memo(({ fields }) => {
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
            </div>

            <Collapse in={!collapsed} timeout={EXPAND_TRANSITION}>
                <div className="domain-system-fields__grid">
                    <Grid data={fields} condensed={true} />
                </div>
            </Collapse>

            <div className="domain-custom-fields-header__text"> Custom Fields </div>
        </>
    );
});
