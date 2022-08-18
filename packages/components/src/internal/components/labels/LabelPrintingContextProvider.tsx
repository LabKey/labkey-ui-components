import React, { ComponentType, FC, memo, useContext, useEffect, useMemo, useState } from 'react';
import { userCanPrintLabels } from './utils';
import { fetchBarTenderConfiguration } from './actions';
import { useServerContext } from '../base/ServerContext';

interface State {
    labelTemplate: string
    printServiceUrl: string
    canPrintLabels: boolean
}

export type LabelPrintingProviderProps = State;

const LabelPrintingContext = React.createContext<LabelPrintingProviderProps>(undefined);

export const useLabelPrintingContext = (): LabelPrintingProviderProps => {
    return useContext(LabelPrintingContext);
};

export const LabelPrintingProvider:FC<LabelPrintingProviderProps> = memo(({children}) => {
    const [labelTemplate, setLabelTemplate] = useState<string>(undefined);
    const [printServiceUrl, setPrintServiceUrl] = useState<string>(undefined);
    const [canPrintLabels, setCanPrintLabels] = useState<boolean>(false);
    const {user} = useServerContext();

    useEffect(() => {
        if (userCanPrintLabels(user)) {
            fetchBarTenderConfiguration().then(btConfiguration => {
                setLabelTemplate(btConfiguration.defaultLabel);
                setCanPrintLabels(!!btConfiguration.serviceURL);
                setPrintServiceUrl(btConfiguration.serviceURL);
            });
        }
    }, []);

    const labelContext = useMemo<LabelPrintingProviderProps>(
        () => ({ labelTemplate, printServiceUrl, canPrintLabels}),
        [labelTemplate, printServiceUrl, canPrintLabels]
    );

    return (
        <LabelPrintingContext.Provider value={labelContext}>
            {children}
        </LabelPrintingContext.Provider>
    )
});

export function withLabelPrintingContext<T>(Component: ComponentType<T>): ComponentType<T & LabelPrintingProviderProps> {
    return props => {
        const context = useLabelPrintingContext();
        return (
            <Component {...context} {...props} />
        );
    };
}
