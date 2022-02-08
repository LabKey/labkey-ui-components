import { HTMLProps } from 'react';
import { MenuItem } from 'react-bootstrap';

export interface ReactBootstrapMenuItemProps extends HTMLProps<MenuItem> {
    active?: boolean;
    bsClass?: string;
    divider?: boolean;
    eventKey?: any;
    header?: boolean;
    onSelect?: any;
}
