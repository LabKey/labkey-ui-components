/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { AnchorHTMLAttributes, DetailedHTMLProps, PureComponent, ReactNode } from 'react';

export class LineageDataLink extends PureComponent<
    DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>
> {
    render(): ReactNode {
        const { children, href, onClick } = this.props;

        if (!href && !onClick) {
            return null;
        }

        return (
            <a {...this.props as any} className="show-on-hover lineage-data-link lineage-data-link--text">
                {children}
            </a>
        );
    }
}
