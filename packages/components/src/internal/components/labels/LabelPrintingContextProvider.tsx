import React, { ComponentType, FC, memo, useContext, useEffect, useMemo, useState } from 'react';

import { useAppContext } from '../../AppContext';

import { useServerContext } from '../base/ServerContext';

import { isSampleManagerEnabled } from '../../app/utils';

import { userCanPrintLabels } from './utils';

export interface LabelPrintingProviderProps {
    canPrintLabels: boolean;
    labelTemplate: string;
    printServiceUrl: string;
}

export type LabelPrintingContextProps = Omit<LabelPrintingProviderProps, 'canPrintLabels'>;

interface OwnProps {
    initialContext?: LabelPrintingContextProps;
}

const LabelPrintingContext = React.createContext<LabelPrintingProviderProps>(undefined);

export const useLabelPrintingContext = (): LabelPrintingProviderProps => {
    return useContext(LabelPrintingContext);
};

// TODO: move implementation to GlobalStateContextProvider
export const LabelPrintingProvider: FC<OwnProps> = memo(({ children, initialContext }) => {
    const { user } = useServerContext();
    const { api } = useAppContext();
    const { fetchBarTenderConfiguration } = api.labelprinting;
    const [canPrintLabels, setCanPrintLabels] = useState<boolean>(() => userCanPrintLabels(user));
    const [labelTemplate, setLabelTemplate] = useState<string>(initialContext?.labelTemplate);
    const [printServiceUrl, setPrintServiceUrl] = useState<string>(initialContext?.printServiceUrl);

    useEffect(() => {
        if (userCanPrintLabels(user) && isSampleManagerEnabled()) {
            fetchBarTenderConfiguration().then(btConfiguration => {
                setLabelTemplate(btConfiguration.defaultLabel);
                setCanPrintLabels(!!btConfiguration.serviceURL);
                setPrintServiceUrl(btConfiguration.serviceURL);
            });
        }
    }, [fetchBarTenderConfiguration, user]);

    const labelContext = useMemo<LabelPrintingProviderProps>(
        () => ({ labelTemplate, printServiceUrl, canPrintLabels }),
        [labelTemplate, printServiceUrl, canPrintLabels]
    );

    return <LabelPrintingContext.Provider value={labelContext}>{children}</LabelPrintingContext.Provider>;
});

export function withLabelPrintingContext<T>(
    Component: ComponentType<T & LabelPrintingProviderProps>
): ComponentType<T> {
    return props => {
        const context = useLabelPrintingContext();
        return <Component {...props} {...context} />;
    };
}
