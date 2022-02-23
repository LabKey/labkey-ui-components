/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC } from 'react'

import { getAdministrationSubNavTabs } from "./actions";
import {ITab, SubNav} from "../navigation/SubNav";
import {AppURL} from "../../url/AppURL";
import {useServerContext} from "../base/ServerContext";

interface Props {}

const PARENT_TAB: ITab = {
    text: 'Dashboard',
    url: AppURL.create('home')
};

export const AdministrationSubNav: FC<Props> = props => {
    const { user } = useServerContext();
    return <SubNav tabs={getAdministrationSubNavTabs(user)} noun={PARENT_TAB}/>;
};
