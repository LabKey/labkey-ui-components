import React, { FC, memo, PropsWithChildren, StyleHTMLAttributes, MouseEvent } from 'react';

import { Link } from 'react-router-dom';

import { ActionURL } from '@labkey/api';

import { AppURL } from './AppURL';
import { isTestEnv } from '../util/utils';

const TARGET_BLANK = '_blank';
const URL_REL = 'noopener noreferrer';

/**
 * If the given href points to our current container & product, return the react router path, in all other cases
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

interface Props extends PropsWithChildren {
    className?: string;
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
    style?: StyleHTMLAttributes<HTMLAnchorElement>;
    targetBlank?: boolean;
    title?: string;
    to: string | AppURL;
}

/**
 * Use this when you need to generate an anchor tag. This should be preferred to all usages of <a> or <Link>, as it
 * handles all the corner cases around moving within our apps, between our apps, to other parts of LKS, and externally.
 */
export const AppLink: FC<Props> = memo(props => {
    const { children, className, onClick, style, targetBlank, title, to } = props;
    let appPath;

    if (to instanceof AppURL && to.isAppPath()) {
        appPath = to.toString();
    } else if (typeof to === 'string') {
        appPath = parseAppPath(to);
    }

    // React Router <Link> components render as empty strings in the test environment, so we force them to render as
    // anchor tags in our tests.
    if (appPath && !isTestEnv()) {
        return (
            <Link className={className} onClick={onClick} style={style} to={appPath}>
                {children}
            </Link>
        );
    }

    return (
        <a
            className={className}
            href={to.toString()}
            onClick={onClick}
            rel={targetBlank ? URL_REL : undefined}
            style={style}
            target={targetBlank ? TARGET_BLANK : undefined}
            title={title}
        >
            {children}
        </a>
    );
});
AppLink.displayName = 'AppLink';
