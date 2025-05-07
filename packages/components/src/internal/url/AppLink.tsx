import React, { FC, memo, PropsWithChildren, StyleHTMLAttributes } from 'react';

import { Link } from 'react-router-dom';

import { ActionURL } from '@labkey/api';

import { AppURL } from './AppURL';

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

    const contextPath = ActionURL.getContextPath();
    const action = ActionURL.getAction();
    const controller = ActionURL.getController();
    const container = ActionURL.getContainer();
    const baseAppUrl = `${contextPath}${container}/${controller}-${action}.view#`;

    if (href.startsWith(baseAppUrl)) {
        // This typically happens when a URL Mapper uses createProductUrl() or a derivative
        return href.replace(baseAppUrl, '');
    }

    return undefined;
}

interface Props extends PropsWithChildren {
    className?: string;
    style?: StyleHTMLAttributes<HTMLAnchorElement>;
    targetBlank?: boolean;
    to: string | AppURL;
}

/**
 * Use this when you need to generate an anchor tag. This should be preferred to all usages of <a> or <Link>, as it
 * handles all the corner cases around moving within our apps, between our apps, to other parts of LKS, and externally.
 */
export const AppLink: FC<Props> = memo(props => {
    const { children, className, style, targetBlank, to } = props;

    const appPath = to instanceof AppURL ? to.toString() : parseAppPath(to);

    if (appPath) {
        return (
            <Link className={className} style={style} to={appPath}>
                {children}
            </Link>
        );
    }

    return (
        <a
            className={className}
            href={to as string}
            rel={targetBlank ? URL_REL : undefined}
            style={style}
            target={targetBlank ? TARGET_BLANK : undefined}
        >
            {children}
        </a>
    );
});
AppLink.displayName = 'AppLink';
