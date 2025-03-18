import React, { FC, memo, PropsWithChildren, useContext, useEffect, useState } from 'react';

import { useAppContext } from '../../AppContext';

import { useServerContext } from '../base/ServerContext';

import { isSampleManagerEnabled } from '../../app/utils';

import { resolveErrorMessage } from '../../util/messaging';

import { userCanPrintLabels } from './utils';

export interface LabelPrintingContext {
    canPrintLabels: boolean;
    defaultLabel: number;
    enabled: boolean;
    error?: string;
    printServiceUrl: string;
}

export type LabelPrintingContextProps = Omit<LabelPrintingContext, 'error'>;

interface LabelPrintingContextProviderProps extends PropsWithChildren {
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
        canPrintLabels: initialContext?.canPrintLabels ?? false,
        defaultLabel: initialContext?.defaultLabel,
        enabled: initialContext?.enabled ?? true,
        printServiceUrl: initialContext?.printServiceUrl,
    }));
    const { enabled } = labelContext;

    useEffect(() => {
        if (!enabled || !userCanPrintLabels(user) || !isSampleManagerEnabled(moduleContext)) return;

        (async () => {
            try {
                const [btConfiguration, templates] = await Promise.all([
                    api.labelprinting.fetchBarTenderConfiguration(),
                    api.labelprinting.ensureLabelTemplatesList(user),
                ]);

                setLabelContext(context => ({
                    ...context,
                    canPrintLabels: !!btConfiguration.serviceURL && templates?.length > 0,
                    defaultLabel: btConfiguration.defaultLabel,
                    printServiceUrl: btConfiguration.serviceURL,
                }));
            } catch (e) {
                setLabelContext(context => ({
                    ...context,
                    canPrintLabels: false,
                    defaultLabel: undefined,
                    error: `Failed to initialize label printing context: "${
                        resolveErrorMessage(e) ?? 'Unknown error'
                    }"`,
                    printServiceUrl: undefined,
                }));
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- do not add labelContext
    }, [api, enabled, moduleContext, user]);

    return <Context.Provider value={labelContext}>{children}</Context.Provider>;
});
LabelPrintingContextProvider.displayName = 'LabelPrintingContextProvider';
