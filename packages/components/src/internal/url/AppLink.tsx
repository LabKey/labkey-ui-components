import React, { AnchorHTMLAttributes, DetailedHTMLProps, FC, memo, useMemo } from 'react';

import { Link } from 'react-router-dom';

import { ActionURL } from '@labkey/api';

import { isTestEnv } from '../util/utils';

import { AppURL } from './AppURL';

const TARGET_BLANK = '_blank';
const URL_REL = 'noopener noreferrer';

/**
 * If the given href points to our current container & product, return the react-router path, in all other cases
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

/** This is a subset of AnchorHTMLAttributes<HTMLAnchorElement> that are passed through to the anchor tag. */
type InheritedHTMLAnchorProps = Omit<
    DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>,
    'href' // overridden by AppLink which uses "to" instead
>;

/** These props are specific to <AppLink>. */
interface Props extends InheritedHTMLAnchorProps {
    targetBlank?: boolean;
    to: string | AppURL | undefined;
}

/**
 * Use this when you need to generate an anchor tag. This should be preferred to all usages of <a> or <Link>, as it
 * handles all the corner cases around moving within our apps, between our apps, to other parts of LKS, and externally.
 */
export const AppLink: FC<Props> = memo(props => {
    const { children, rel, target, targetBlank, to, ...anchorProps } = props;

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
        return (
            <Link {...anchorProps} to={appPath}>
                {children}
            </Link>
        );
    }

    return (
        <a
            {...anchorProps}
            href={to?.toString()}
            rel={targetBlank ? URL_REL : rel}
            target={targetBlank ? TARGET_BLANK : target}
        >
            {children}
        </a>
    );
});
AppLink.displayName = 'AppLink';
