/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { useGlobalStateContext } from '../../GlobalStateContext';

import { FolderMenuGlobalContext, SubNavGlobalContext } from './types';

export const useFolderMenuContext = (): FolderMenuGlobalContext => {
    return useGlobalStateContext().navigation.folderMenu;
};

export const useSubNavTabsContext = (): SubNavGlobalContext => {
    return useGlobalStateContext().navigation.subNav;
};
