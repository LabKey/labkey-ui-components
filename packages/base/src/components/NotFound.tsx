/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'

import { Page } from './Page'

export class NotFound extends React.Component<any, any>{
    render() {
        return <Page><h1>Not Found</h1></Page>;
    }
}