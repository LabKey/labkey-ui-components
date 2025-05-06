import React, { FC, memo, PropsWithChildren, StyleHTMLAttributes } from 'react';

import { Link } from 'react-router-dom';

import { AppURL } from './AppURL';
import { ActionURL } from '@labkey/api';

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
    appUrl?: AppURL;
    className: string;
    href?: string;
    style: StyleHTMLAttributes<HTMLAnchorElement>;
    targetBlank?: boolean;
}

/**
 * Use this when you need to generate an anchor tag. This should be preferred to all usages of <a> or <Link>, as it
 * handles all the corner cases around moving within our apps, between our apps, to other parts of LKS, and externally.
 */
export const AppLink: FC<Props> = memo(props => {
    const { appUrl, children, className, href, style, targetBlank } = props;

    if (!appUrl && !href) throw new Error('AppLink: incorrect usage. Must pass "href" or "appUrl".');

    const to = appUrl ? appUrl.toString() : parseAppPath(href);

    if (to) {
        return (
            <Link className={className} style={style} to={to}>
                {children}
            </Link>
        );
    }

    return (
        <a
            className={className}
            href={href}
            rel={targetBlank ? URL_REL : undefined}
            style={style}
            target={targetBlank ? TARGET_BLANK : undefined}
        >
            {children}
        </a>
    );
});
AppLink.displayName = 'AppLink';
