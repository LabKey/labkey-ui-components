import { NotificationItemModel } from "./model";
import * as React from "react";
import { User } from "@glass/models";
import { dismissNotifications } from "./global";

interface ItemProps {
    item: NotificationItemModel
    user: User
}

export class NotificationItem extends React.Component<ItemProps, any> {

    render() {
        const { user } = this.props;
        const { data, id, message, isDismissible } = this.props.item;

        return (
            <div>
                {typeof message === 'function' ? message(this.props.item, user, data) : message}
                {isDismissible &&  <i style={{float: "right"}}
                                      className="fa fa-times-circle pointer"
                                      onClick={() => dismissNotifications(id)}/>}
            </div>
        )
    }
}

