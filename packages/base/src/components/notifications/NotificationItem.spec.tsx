import * as React from 'react'
import { NotificationItemModel } from "./model";
import { NotificationItem } from "./NotificationItem";
import { User } from "@glass/models";
import { shallow } from "enzyme";
import { initNotificationsState } from "./global";
import { createNotification } from "./actions";

describe("<NotificationItem />", () => {
    test("not dismissible item", () => {
        const item = new NotificationItemModel({
            message: "A message",
            id: "not_dismissible_item",
            isDismissible: false
        });
        const tree = shallow(<NotificationItem item={item} user={new User()}/>);
        expect(tree.find(".fa-times-circle")).toHaveLength(0);
        expect(tree).toMatchSnapshot();
    });

    test("dismissible item", () => {
        initNotificationsState();
        const onDismiss = jest.fn();
        const item = new NotificationItemModel({
            message: "A dismissible message",
            id: "dismissible_item",
            isDismissible: true,
            onDismiss,
        });
        createNotification(item);
        const tree = shallow(<NotificationItem item={item} user={new User()}/>);
        const dismissIcon = tree.find(".fa-times-circle");
        expect(dismissIcon).toHaveLength(1);
        dismissIcon.simulate('click');
        expect(onDismiss).toHaveBeenCalledTimes(1);
        expect(tree).toMatchSnapshot();
    });

    test("with message function", () => {
        const messageFn = jest.fn();
        const item = new NotificationItemModel({
            message: messageFn,
            id: "with_message_function",
            isDismissible: true
        });
        const tree = shallow(<NotificationItem item={item} user={new User()}/>);
        expect(tree.find(".fa-times-circle")).toHaveLength(1);
        expect(messageFn).toHaveBeenCalledTimes(1);
        expect(tree).toMatchSnapshot();
    })
});