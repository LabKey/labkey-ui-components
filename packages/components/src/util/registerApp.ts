export interface InitAppEventDetail<CTX = any> {
    appName: string;
    appContext: CTX;
    appTarget: string;
}

type OnInitCallback<CTX> = (target: string, ctx: CTX) => void;

interface AppRegistryItem<CTX = any> {
    appName: string;
    contexts: CTX[];
    hot: boolean;
    onInit: OnInitCallback<CTX>;
    targets: string[];
}

let appRegistry: {
    isDOMContentLoaded: boolean;
    registry: { [appName: string]: AppRegistryItem };
} = {
    isDOMContentLoaded: false,
    registry: {},
};

declare var LABKEY: any;

// Prepare global registry shared across apps
if (LABKEY) {
    if (!LABKEY.__app__) {
        LABKEY.__app__ = appRegistry;
    }

    appRegistry = LABKEY.__app__;
}

// Global listener for initializing apps
window.addEventListener('initApp', (event: CustomEvent<InitAppEventDetail>) => {
    const { appContext, appName, appTarget } = event.detail;

    if (appRegistry.registry.hasOwnProperty(appName)) {
        if (appRegistry.registry[appName].hot) {
            appRegistry.registry[appName].contexts.push(appContext);
            appRegistry.registry[appName].targets.push(appTarget);
        }

        if (appRegistry.isDOMContentLoaded) {
            appRegistry.registry[appName].onInit(appTarget, appContext);
        } else {
            window.addEventListener(
                'DOMContentLoaded',
                () => {
                    appRegistry.isDOMContentLoaded = true;
                    appRegistry.registry[appName].onInit(appTarget, appContext);
                },
                { once: true }
            );
        }
    } else {
        throw Error(`Application "${appName}" is not a registered application. Unable to initialize.`);
    }
});

export function registerApp<CTX>(appName: string, onInit: OnInitCallback<CTX>, hot?: boolean): void {
    if (!appRegistry.registry.hasOwnProperty(appName)) {
        appRegistry.registry[appName] = {
            appName,
            contexts: [],
            hot: hot === true,
            onInit,
            targets: [],
        };
    } else if (appRegistry.registry[appName].hot) {
        runHot(appRegistry.registry[appName]);
    }
}

function runHot(item: AppRegistryItem): void {
    if (!item.hot) {
        throw Error(`Attempting to run application ${item.appName} hot when hot is not enabled.`);
    }

    if (item.targets.length !== item.contexts.length) {
        throw Error(
            `Application registry for "${item.appName}" is in an invalid state. Expected targets and contexts to align.`
        );
    }

    for (let i = 0; i < item.targets.length; i++) {
        item.onInit(item.targets[i], item.contexts[i]);
    }
}
