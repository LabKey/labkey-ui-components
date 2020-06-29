import { AppURL, buildURL } from '../..';
import { Location } from "history";

export const ON_LEAVE_DIRTY_STATE_MESSAGE = 'You have unsaved changes that will be lost. Are you sure you want to continue?';

/**
 * This function can be used as the callback for react-router's setRouteLeaveHook.  It should be preferred
 * over a callback that simply returns the confirm message because with react-router v3.x, the URL route
 * will have already been changed by the time this confirm is shown and will not be reset if the user does not confirm.
 * If the user tries to click on the initial link again after canceling, nothing will happen because the URL
 * in the browser will not change. (Issue 39633).
 * See also https://stackoverflow.com/questions/32841757/detecting-user-leaving-page-with-react-router
 *
 * @param currentLocation the location of the current page
 */
export function confirmLeaveWhenDirty(currentLocation: Location) : boolean {
    const result = confirm(ON_LEAVE_DIRTY_STATE_MESSAGE);
    if (result) {
        // navigation confirmed
        return true;
    } else {
        // navigation canceled, pushing the previous path
        if (currentLocation) {
            let appURL = AppURL.create(...currentLocation.pathname.substring(1).split("/").map((part) => (decodeURIComponent(part))));
            window.history.replaceState(null, null,  appURL.toHref() + currentLocation.search);
        }

        return false;
    }
}

export function getHref(url : AppURL | string) : string {
    return typeof url == 'string' ? url : url.toHref();
}

export function createApplicationUrlFromParts(urlProductId: string, currentProductId: string, params: { [key: string]: any }, ...parts) : string | AppURL {
    let appUrl = AppURL.create(...parts);
    appUrl = appUrl.addParams(params);
    return createApplicationUrl(urlProductId, currentProductId, appUrl);
}

export function createApplicationUrl(urlProductId: string, currentProductId: string, appUrl: string | AppURL) : string | AppURL {
    if (urlProductId && (!currentProductId || urlProductId.toLowerCase() !== currentProductId.toLowerCase())) {
        const href = appUrl instanceof AppURL ? appUrl.toHref() : appUrl;
        return buildURL(urlProductId.toLowerCase(), "app.view", undefined, {returnURL: false}) + href;
    } else {
        return appUrl;
    }
}
