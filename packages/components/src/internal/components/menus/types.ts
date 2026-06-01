/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
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
