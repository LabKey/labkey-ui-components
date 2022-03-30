import { HTMLProps } from 'react';

export interface ReactBootstrapMenuItemProps extends HTMLProps<any> {
    active?: boolean;
    bsClass?: string;
    capture?: any;
    divider?: boolean;
    eventKey?: any;
    header?: boolean;
    onSelect?: any;
}
