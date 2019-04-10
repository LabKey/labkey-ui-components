import { initNotificationsState } from "../components/notifications/global";

// initialize the global state and the LABKEY object with enough structure to work for notifications
export function notificationInit()  {
    initNotificationsState();
    LABKEY.moduleContext = {

    };
    LABKEY.container = {
        'formats': {dateTimeFormat: "yyyy-MM-dd HH:mm", numberFormat: null, dateFormat: "yyyy-MM-dd"}
    };
}