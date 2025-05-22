import { useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

import { AppURL } from './AppURL';
import { parseAppPath } from './AppLink';

export type NavigateFn = (url: string | AppURL, replace?: boolean) => void;

/**
 * goBack: equivalent to navigate(-1), or using the back button.
 * navigate: Takes an AppURL or string, and uses ReactRouter to navigate if possible, using the following logic:
 *  - If url is an AppURL it navigates via React Router's navigate method
 *  - If url is a string prefixed with # it will assume the URL is an app path, and use RR's navigate method
 *  - If url is a string pointing to an app path for the current app it will navigate via RR's navigate method
 *  - In all other cases it will use window.location.href to navigate to the given URL
 * string it navigates via window.location.href = url. If you have an AppURL you should always pass it, instead of
 * AppURL.toString() or AppURL.toHref().
 */
interface AppNavigateState {
    goBack: () => void;
    navigate: NavigateFn;
}

export function useAppNavigate(): AppNavigateState {
    const rrNavigate = useNavigate();
    const navigate = useCallback<NavigateFn>(
        (url, replace = false) => {
            let appPath: string;

            if (url instanceof AppURL && url.isAppPath()) {
                appPath = url.toString();
            } else if (typeof url === 'string') {
                appPath = parseAppPath(url);
            }

            if (appPath) {
                rrNavigate(appPath, { replace });
                return;
            }

            window.location.href = url.toString();
        },
        [rrNavigate]
    );
    const goBack = useCallback(() => rrNavigate(-1), [rrNavigate]);

    return useMemo(() => ({ navigate, goBack }), [goBack, navigate]);
}
