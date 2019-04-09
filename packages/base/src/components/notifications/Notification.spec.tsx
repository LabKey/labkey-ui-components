import * as React from 'react'
import renderer from 'react-test-renderer'
import { User } from "@glass/models";
import { Notification } from './Notification'
import { createNotification } from "./actions";
import { NotificationItemModel } from "./model";
import { mount, shallow } from "enzyme";
import { initNotificationsState } from "./global";
import { NotificationItem } from "./NotificationItem";
import moment = require("moment");

beforeEach(() => {
    initNotificationsState();
    LABKEY.moduleContext = {

    };
    LABKEY.container = {
        'formats': {dateTimeFormat: "yyyy-MM-dd HH:mm", numberFormat: null, dateFormat: "yyyy-MM-dd"}
    };
});

describe("<Notification/>", () => {

    test("no notifications", () => {
        const tree = renderer.create(<Notification user={new User()}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("no notification with header", () => {
       const tree = renderer.create(<Notification notificationHeader={"Header message"} user={new User()}/>).toJSON();
       expect(tree).toMatchSnapshot();
    });

    test("one notification", () => {
        createNotification(new NotificationItemModel({
            alertClass: 'success',
            id: "one_notification",
            message: "one is the loneliest number"
        }));
        const notification = shallow(<Notification user={new User()}/>);
        expect(notification.find(NotificationItem)).toHaveLength(1);
        expect(notification).toMatchSnapshot();
    });

    test("multiple notification classes", () => {
        createNotification(new NotificationItemModel( {
            alertClass: 'info',
            id: "info1",
            message: "info message 1"
        }));
        createNotification(new NotificationItemModel( {
            alertClass: 'info',
            id: 'info2',
            message: 'info message 2'
        }));
        createNotification("default message class");
        createNotification(new NotificationItemModel({
            alertClass: 'danger',
            id: 'danger1',
            message: "Danger, Will Robinson!"
        }));
        const notifications = shallow(<Notification user={new User()}/>);
        expect(notifications.find(NotificationItem)).toHaveLength(4);
        expect(notifications.find('.notification-container')).toHaveLength(3);
        expect(notifications).toMatchSnapshot();
    });

    test("with trial notification for non-admin", () => {
        LABKEY.moduleContext = {
            trialservices: {
                trialEndDate: moment().add(1, 'days').format("YYYY-MM-DD"),
                upgradeLink: "your/link/to/the/future",
                upgradeLinkText: "Upgrade now"
            }
        };
        const notifications = mount(<Notification user={new User()}/>);
        expect(notifications.find(NotificationItem)).toHaveLength(1);
        expect(notifications.find('a')).toHaveLength(0);
        expect(notifications).toMatchSnapshot();
        notifications.unmount();
    });

    test("with trial notification for admin", () => {
        LABKEY.moduleContext = {
            trialservices: {
                trialEndDate: moment().add(1, 'days').format("YYYY-MM-DD"),
                upgradeLink: "your/link/to/the/future",
                upgradeLinkText: "Upgrade now"
            }
        };
        const notifications = mount(<Notification user={new User( {isAdmin: true} )}/>);
        expect(notifications.find(NotificationItem)).toHaveLength(1);
        expect(notifications.find('a')).toHaveLength(1);
        expect(notifications).toMatchSnapshot();
        notifications.unmount();
    })
});

