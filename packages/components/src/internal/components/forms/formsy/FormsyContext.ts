/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
// This file was originally derived from the "formsy-react" package, specifically, v2.3.2.
// Credit: Christian Alfoni and the Formsy Authors
// Repository: https://github.com/formsy/formsy-react/tree/0226fab133a25
import React from 'react';

import { FormsyContextInterface } from './types';

const throwNoFormsyProvider = () => {
    throw new Error('Could not find Formsy Context Provider. Did you use withFormsy outside <Formsy />?');
};

const defaultValue = {
    attachToForm: throwNoFormsyProvider,
    detachFromForm: throwNoFormsyProvider,
    isFormDisabled: true,
    isValidValue: throwNoFormsyProvider,
    validate: throwNoFormsyProvider,
    runValidation: throwNoFormsyProvider,
};

export const FormsyContext = React.createContext<FormsyContextInterface>(defaultValue);
