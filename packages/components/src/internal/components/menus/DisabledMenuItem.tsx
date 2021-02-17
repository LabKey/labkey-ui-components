import React, { FC, memo } from 'react'
import { OverlayTrigger, Popover } from "react-bootstrap";

interface props {
    idPrefix: string,
    pluralNoun: string,
    item: React.ReactNode
}

export const DisabledMenuItem: FC<props> = memo((props) => {
    const { idPrefix, pluralNoun, item } = props;

    const overlay = <Popover id={idPrefix + "-disabled-warning"}>Select one or more {pluralNoun}.</Popover>;

    return (
        <OverlayTrigger overlay={overlay} placement="right">
            {item}
        </OverlayTrigger>
    )
});
