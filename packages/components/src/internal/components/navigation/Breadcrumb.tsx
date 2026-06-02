/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, PropsWithChildren, ReactNode } from 'react';
import classNames from 'classnames';

interface Props extends PropsWithChildren {
    className?: string;
}

export const Breadcrumb: FC<Props> = props => {
    const children: ReactNode[] = [];
    React.Children.forEach(props.children, c => {
        if (c !== null) {
            children.push(c);
        }
    });

    if (children.length === 0) {
        return null;
    }

    return (
        <ol className={classNames('breadcrumb', props.className)}>
            {React.Children.map(children, (child, i) => {
                return (
                    <>
                        {i > 0 && <li className="separator">&nbsp;/&nbsp;</li>}
                        <li>{child}</li>
                    </>
                );
            })}
        </ol>
    );
};

Breadcrumb.displayName = 'Breadcrumb';
