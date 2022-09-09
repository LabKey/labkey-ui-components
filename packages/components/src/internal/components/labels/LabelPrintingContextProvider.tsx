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
export type LabelPrintingContextProps = Omit<State, "canPrintLabels">;

interface OwnProps {
    initialContext?: LabelPrintingContextProps;
}

const LabelPrintingContext = React.createContext<LabelPrintingProviderProps>(undefined);

export const useLabelPrintingContext = (): LabelPrintingProviderProps => {
    return useContext(LabelPrintingContext);
};

export const LabelPrintingProvider: FC<OwnProps> = memo(({ children, initialContext }) => {
    const { user } = useServerContext();
    const [canPrintLabels, setCanPrintLabels] = useState<boolean>( () => userCanPrintLabels(user));
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
