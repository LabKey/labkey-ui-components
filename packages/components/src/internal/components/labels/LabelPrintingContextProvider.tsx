import React, { ComponentType, FC, memo, useContext, useEffect, useMemo, useState } from 'react';

import { useServerContext } from '../base/ServerContext';

import { isSampleManagerEnabled } from '../../app/utils';

import { userCanPrintLabels } from './utils';
import { fetchBarTenderConfiguration } from './actions';

interface State {
    canPrintLabels: boolean;
    labelTemplate: string;
    printServiceUrl: string;
}

export type LabelPrintingProviderProps = State;
export interface LabelPrintingContextProps {
    initialContext?: State;
}

const LabelPrintingContext = React.createContext<LabelPrintingProviderProps>(undefined);

export const useLabelPrintingContext = (): LabelPrintingProviderProps => {
    return useContext(LabelPrintingContext);
};

export const LabelPrintingProvider: FC<LabelPrintingContextProps> = memo(({ children, initialContext }) => {
    const [labelTemplate, setLabelTemplate] = useState<string>(initialContext?.labelTemplate);
    const [printServiceUrl, setPrintServiceUrl] = useState<string>(initialContext?.printServiceUrl);
    const [canPrintLabels, setCanPrintLabels] = useState<boolean>(!!initialContext?.canPrintLabels);
    const { user } = useServerContext();

    useEffect(() => {
        if (userCanPrintLabels(user) && isSampleManagerEnabled()) {
            fetchBarTenderConfiguration().then(btConfiguration => {
                setLabelTemplate(btConfiguration.defaultLabel);
                setCanPrintLabels(!!btConfiguration.serviceURL);
                setPrintServiceUrl(btConfiguration.serviceURL);
            });
        }
    }, [user]);

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
