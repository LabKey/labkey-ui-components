/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { useNavigate } from 'react-router';
import { useCallback, useMemo } from 'react';

import { redirect } from './ActionURL';
import { AppURL } from './AppURL';
import { parseAppPath } from './AppLink';

export type NavigateFn = (url: string | AppURL, replace?: boolean) => void;

/**
 * goBack: equivalent to navigate(-1), or using the back button.
 * navigate: Takes an AppURL or string, and uses ReactRouter to navigate if possible, using the following logic:
 *  - If url is an AppURL it navigates via React Router's navigate method
 *  - If url is a string prefixed with # it will assume the URL is an app path, and use RR's navigate method
 *  - If url is a string pointing to an app path for the current app it will navigate via RR's navigate method
 *  - In all other cases it navigates to the given URL via the redirect() helper, which routes through the
 * core/safeRedirect action to guard against open-redirect vulnerabilities. If you have an AppURL you should always
 * pass it, instead of AppURL.toString() or AppURL.toHref().
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

            redirect(url);
        },
        [rrNavigate]
    );
    const goBack = useCallback(() => rrNavigate(-1), [rrNavigate]);

    return useMemo(() => ({ navigate, goBack }), [goBack, navigate]);
}
