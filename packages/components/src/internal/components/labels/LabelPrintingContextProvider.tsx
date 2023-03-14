import React, { ComponentType, FC, memo, useContext, useEffect, useMemo, useState } from 'react';

import { useAppContext } from '../../AppContext';

import { useServerContext } from '../base/ServerContext';

import { isSampleManagerEnabled } from '../../app/utils';

import { userCanPrintLabels } from './utils';
import { BarTenderConfiguration, LabelTemplate } from './models';

export interface LabelPrintingProviderProps {
    canPrintLabels: boolean;
    defaultLabel: number;
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
    const { fetchBarTenderConfiguration, ensureLabelTemplatesList } = api.labelprinting;
    const [canPrintLabels, setCanPrintLabels] = useState<boolean>(() => userCanPrintLabels(user));
    const [printServiceUrl, setPrintServiceUrl] = useState<string>(initialContext?.printServiceUrl);
    const [defaultLabel, setDefaultLabel] = useState<number>(initialContext?.defaultLabel);

    useEffect(() => {
        if (userCanPrintLabels(user) && isSampleManagerEnabled()) {
            Promise.all([fetchBarTenderConfiguration(), ensureLabelTemplatesList(user)]).then(
                (responses: [BarTenderConfiguration, LabelTemplate[]]) => {
                    const [btConfiguration, templates] = responses;
                    setCanPrintLabels(!!btConfiguration.serviceURL && templates?.length > 0);
                    setPrintServiceUrl(btConfiguration.serviceURL);
                    setDefaultLabel(btConfiguration.defaultLabel);
                }
            );
        }
    }, [fetchBarTenderConfiguration, ensureLabelTemplatesList, user]);

    const labelContext = useMemo<LabelPrintingProviderProps>(
        () => ({ printServiceUrl, canPrintLabels, defaultLabel }),
        [printServiceUrl, canPrintLabels, defaultLabel]
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
