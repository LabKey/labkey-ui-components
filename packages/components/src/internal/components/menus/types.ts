import { HTMLProps } from 'react';

export interface ReactBootstrapMenuItemProps extends HTMLProps<any> {
    active?: boolean;
    bsClass?: string;
    divider?: boolean;
    eventKey?: any;
    header?: boolean;
}
