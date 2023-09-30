import React, { FC, memo, useContext, useEffect, useState } from 'react';

import { useAppContext } from '../../AppContext';

import { useServerContext } from '../base/ServerContext';

import { isSampleManagerEnabled } from '../../app/utils';

import { userCanPrintLabels } from './utils';

export interface LabelPrintingContext {
    canPrintLabels: boolean;
    defaultLabel: number;
    printServiceUrl: string;
}

export type LabelPrintingContextProps = Omit<LabelPrintingContext, 'canPrintLabels'>;

interface LabelPrintingContextProviderProps {
    initialContext?: LabelPrintingContextProps;
}

const Context = React.createContext<LabelPrintingContext>(undefined);

export const useLabelPrintingContext = (): LabelPrintingContext => {
    return useContext(Context);
};

export const LabelPrintingContextProvider: FC<LabelPrintingContextProviderProps> = memo(props => {
    const { children, initialContext } = props;
    const { moduleContext, user } = useServerContext();
    const { api } = useAppContext();
    const [labelContext, setLabelContext] = useState<LabelPrintingContext>(() => ({
        canPrintLabels: userCanPrintLabels(user),
        defaultLabel: initialContext?.defaultLabel,
        printServiceUrl: initialContext?.printServiceUrl,
    }));

    useEffect(() => {
        if (!userCanPrintLabels(user) || !isSampleManagerEnabled(moduleContext)) return;

        // TODO: This needs to handle errors
        Promise.all([
            api.labelprinting.fetchBarTenderConfiguration(),
            api.labelprinting.ensureLabelTemplatesList(user),
        ]).then(responses => {
            const [btConfiguration, templates] = responses;
            setLabelContext({
                canPrintLabels: !!btConfiguration.serviceURL && templates?.length > 0,
                defaultLabel: btConfiguration.defaultLabel,
                printServiceUrl: btConfiguration.serviceURL,
            });
        });
    }, [api, moduleContext, user]);

    return <Context.Provider value={labelContext}>{children}</Context.Provider>;
});
