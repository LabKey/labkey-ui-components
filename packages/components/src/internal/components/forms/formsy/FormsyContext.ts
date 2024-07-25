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
