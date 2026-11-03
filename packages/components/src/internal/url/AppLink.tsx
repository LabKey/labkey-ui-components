/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, {
    AnchorHTMLAttributes,
    DetailedHTMLProps,
    FC,
    memo,
    MouseEvent,
    useCallback,
    useContext,
    useMemo,
} from 'react';

import { createPath, Link, parsePath, Navigator as RouterNavigator, UNSAFE_DataRouterContext } from 'react-router';

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

const HREF_PREFIXES = new WeakMap<RouterNavigator, string>();

// Hash history's createHref scans the whole document for <base> on every call, so derive its prefix once per router
function getHrefPrefix(navigator: RouterNavigator): string {
    let prefix = HREF_PREFIXES.get(navigator);
    if (prefix === undefined) {
        prefix = navigator.createHref({ pathname: '/' }).slice(0, -1);
        HREF_PREFIXES.set(navigator, prefix);
    }
    return prefix;
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

/**
 * Use this when you need to generate an anchor tag. This should be preferred to all usages of <a> or <Link>, as it
 * handles all the corner cases around moving within our apps, between our apps, to other parts of LKS, and externally.
 */
export const AppLink: FC<Props> = memo(props => {
    const { children, onClick, rel: relProp, target: targetProp, targetBlank, to, ...anchorProps } = props;
    const rel = relProp ?? (targetBlank ? URL_REL : undefined);
    const target = targetProp ?? (targetBlank ? TARGET_BLANK : undefined);
    // Unlike <Link>, which subscribes to the location and re-renders on every navigation, the data router is stable
    const dataRouter = useContext(UNSAFE_DataRouterContext);
    const router = dataRouter?.router;

    const appPath = useMemo<string | undefined>(() => {
        if (to instanceof AppURL && to.isAppPath()) {
            return to.toString();
        } else if (typeof to === 'string') {
            return parseAppPath(to);
        }

        return undefined;
    }, [to]);

    const appHref = useMemo<string | undefined>(
        () =>
            appPath && dataRouter ? getHrefPrefix(dataRouter.navigator) + createPath(parsePath(appPath)) : undefined,
        [appPath, dataRouter]
    );

    const onAppPathClick = useCallback(
        (event: MouseEvent<HTMLAnchorElement>): void => {
            onClick?.(event);
            if (event.defaultPrevented || !shouldNavigateInApp(event, target)) return;

            event.preventDefault();
            const replace = createPath(router.state.location) === createPath(parsePath(appPath));
            router.navigate(appPath, { replace });
        },
        [appPath, onClick, router, target]
    );

    // React Router <Link> components render as empty strings in the test environment, so we force them to render as
    // anchor tags in our tests.
    if (appPath && !isTestEnv()) {
        if (router) {
            return (
                <a {...anchorProps} href={appHref} onClick={onAppPathClick} rel={rel} target={target}>
                    {children}
                </a>
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
