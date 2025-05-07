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
import React, { FC, memo, PropsWithChildren, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { AppURL } from '../../url/AppURL';
import { AppLink } from '../../url/AppLink';

interface NavItemProps extends PropsWithChildren {
    isActive?: boolean;
    onActive?: (activeEl: HTMLElement) => void;
    to?: string | AppURL;
}

export const NavItem: FC<NavItemProps> = memo(({ children, onActive, to, isActive }) => {
    const location = useLocation();
    const itemRef = useRef<HTMLLIElement>(undefined);
    const [active, setActive] = useState<boolean>(false);

    useEffect(() => {
        if (to && location) {
            const toString = to.toString();
            const paramIndex = toString.indexOf('?');
            const _isActive =
                isActive !== undefined
                    ? isActive
                    : location.pathname.toLowerCase() ===
                      toString.substring(0, paramIndex < 0 ? toString.length : paramIndex).toLowerCase();
            setActive(_isActive);

            if (_isActive) {
                onActive?.(itemRef.current);
            }
        } else {
            setActive(false);
        }
    }, [isActive, location, onActive, to]);

    return (
        <li className={active ? 'active' : null} ref={itemRef}>
            <AppLink to={to}>{children}</AppLink>
        </li>
    );
});
NavItem.displayName = 'NavItem';

export const ParentNavItem: FC<NavItemProps> = memo(({ children, to }) => (
    <div className="parent-nav">
        <ul className="nav navbar-nav">
            <li>
                <AppLink to={to}>
                    <i className="fa fa-chevron-left" />
                    &nbsp;
                    {children}
                </AppLink>
            </li>
        </ul>
    </div>
));
ParentNavItem.displayName = 'ParentNavItem';
