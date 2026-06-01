/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { createContext, useContext } from 'react';

export interface FilterCriteriaState {
    openModal: (openToPropertyId?: number) => void;
}

export const FilterCriteriaContext = createContext<FilterCriteriaState>(undefined);

export const useFilterCriteriaContext = () => useContext(FilterCriteriaContext);
