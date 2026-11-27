/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { AnchorHTMLAttributes, DetailedHTMLProps, FC, memo, MouseEvent, useCallback, useMemo } from 'react';

import { createPath, Link, parsePath, useNavigate } from 'react-router';

import { ActionURL } from '@labkey/api';

import { isTestEnv } from '../util/utils';

import { AppURL } from './AppURL';

const TARGET_BLANK = '_blank';
const URL_REL = 'noopener noreferrer';

/**
 * If the given href points to our current container and product, return the react-router path, in all other cases
 * return undefined.
 * @param href
 */
export function parseAppPath(href: string): string | undefined {
    if (href.startsWith('#')) {
        // This typically happens when a URL Mapper uses AppURl.create().toHref()
        return href.replace('#', '');
    }

    const { action, containerPath, controller } = ActionURL.getPathFromLocation();
    const baseAppUrl = ActionURL.buildURL(controller, action, containerPath) + '#';

    if (href.startsWith(baseAppUrl)) {
        // This typically happens when a URL Mapper uses toHref() or something similar
        return href.replace(baseAppUrl, '');
    }

    return undefined;
}

// Mirrors react-router's <Link>: leave modified, non-primary, and new-target clicks to the browser
function shouldNavigateInApp(event: MouseEvent<HTMLAnchorElement>, target: string | undefined): boolean {
    const isModified = event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
    return event.button === 0 && (!target || target === '_self') && !isModified;
}

/** This is a subset of AnchorHTMLAttributes<HTMLAnchorElement> that are passed through to the anchor tag. */
type InheritedHTMLAnchorProps = Omit<
    DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>,
    'href' // overridden by AppLink, which uses "to" instead
>;

/** These props are specific to <AppLink>. */
interface Props extends InheritedHTMLAnchorProps {
    /** Opens the link in a new tab, protected from the opener. Applies only to whichever of "target"/"rel" is not supplied. */
    targetBlank?: boolean;
    to: AppURL | string | undefined;
}

interface AppPathLinkProps extends InheritedHTMLAnchorProps {
    appPath: string;
}

// Every LabKey app uses a hash router and no <base>, so the href is the path behind a "#"
const AppPathLink: FC<AppPathLinkProps> = memo(props => {
    const { appPath, children, onClick, target, ...anchorProps } = props;
    // Grids render an AppLink per row, and paging rewrites the URL, so each link re-renders on every page change. <Link>
    // re-resolves its href then, and hash history's createHref searches the whole document for <base> on every call, so
    // avoiding <Link> saves ~830 ms per page change at 1,000 rows and ~220 ms at 500 (GH Issue 1790).
    const navigate = useNavigate();
    const href = useMemo(() => '#' + createPath(parsePath(appPath)), [appPath]);

    const onAppPathClick = useCallback(
        (event: MouseEvent<HTMLAnchorElement>): void => {
            // The caller's handler runs first and can cancel the navigation by calling preventDefault()
            onClick?.(event);
            if (event.defaultPrevented || !shouldNavigateInApp(event, target)) return;

            // Left to the browser, the hash change becomes a POP navigation, which skips route-leave blockers
            event.preventDefault();
            // As <Link> does, revisiting the current location replaces its history entry instead of duplicating it
            const current = createPath(parsePath(window.location.hash.slice(1)));
            navigate(appPath, { replace: current === createPath(parsePath(appPath)) });
        },
        [appPath, navigate, onClick, target]
    );

    return (
        <a {...anchorProps} href={href} onClick={onAppPathClick} target={target}>
            {children}
        </a>
    );
});
AppPathLink.displayName = 'AppPathLink';

/**
 * Use this when you need to generate an anchor tag. This should be preferred to all usages of <a> or <Link>, as it
 * handles all the corner cases around moving within our apps, between our apps, to other parts of LKS, and externally.
 */
export const AppLink: FC<Props> = memo(props => {
    const { children, onClick, rel: relProp, target: targetProp, targetBlank, to, ...anchorProps } = props;
    const rel = relProp ?? (targetBlank ? URL_REL : undefined);
    const target = targetProp ?? (targetBlank ? TARGET_BLANK : undefined);

    const appPath = useMemo<string | undefined>(() => {
        if (to instanceof AppURL && to.isAppPath()) {
            return to.toString();
        } else if (typeof to === 'string') {
            return parseAppPath(to);
        }

        return undefined;
    }, [to]);

    // React Router <Link> components render as empty strings in the test environment, so we force them to render as
    // anchor tags in our tests.
    if (appPath && !isTestEnv()) {
        // The hand-built href doesn't resolve relative paths, so <Link> handles those
        if (appPath.startsWith('/')) {
            return (
                <AppPathLink {...anchorProps} appPath={appPath} onClick={onClick} rel={rel} target={target}>
                    {children}
                </AppPathLink>
            );
        }

        return (
            <Link {...anchorProps} onClick={onClick} rel={rel} target={target} to={appPath}>
                {children}
            </Link>
        );
    }

    return (
        <a {...anchorProps} href={to?.toString()} onClick={onClick} rel={rel} target={target}>
            {children}
        </a>
    );
});
AppLink.displayName = 'AppLink';
