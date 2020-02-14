import React from 'react';

interface Props {
    controlledCollapse: boolean
    collapsible?: boolean
    initCollapsed: boolean
    onToggle?: (collapsed: boolean, callback: () => any) => any
}

export interface IDomainPropertiesPanelContext {
    collapsed: boolean
    togglePanel?: (evt: any, collapsed?: boolean) => void
    getPanelClass?: (useTheme: boolean) => string
    getAlertClasses?: (useTheme: boolean) => string
}

const DomainPropertiesPanelContext = React.createContext<IDomainPropertiesPanelContext>(undefined);
export const DomainPropertiesPanelContextProvider = DomainPropertiesPanelContext.Provider;
export const DomainPropertiesPanelContextConsumer = DomainPropertiesPanelContext.Consumer;

// default provider
export class DomainPropertiesPanelProvider extends React.Component<Props, IDomainPropertiesPanelContext> {

    static defaultProps = {
        initCollapsed: false
    };

    constructor(props) {
        super(props);

        this.state = {
            collapsed: props.initCollapsed
        };
    }

    componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
        const { controlledCollapse, initCollapsed } = this.props;

        // if controlled collapse, allow the prop change to update the collapsed state
        if (controlledCollapse && nextProps.initCollapsed !== initCollapsed) {
            this.toggleLocalPanel(nextProps.initCollapsed);
        }
    }

    toggleLocalPanel = (collapsed?: boolean) => {
        this.setState((state) => ({
            collapsed: collapsed !== undefined ? collapsed : !state.collapsed,
        }));
    };

    togglePanel = (evt: any, collapsed?: boolean) => {
        const { onToggle, collapsible, controlledCollapse } = this.props;

        if (collapsible || controlledCollapse) {
            if (onToggle) {
                onToggle((collapsed !== undefined ? collapsed : !this.state.collapsed), this.toggleLocalPanel);
            }
            else {
                this.toggleLocalPanel(collapsed)
            }
        }
    };

    getPanelClass = (useTheme: boolean) => {
        const { collapsed } = this.state;

        let classes = 'domain-form-panel';
        if (!collapsed) {
            if (useTheme) {
                classes += ' lk-border-theme-light';
            }
            else {
                classes += ' domain-panel-no-theme';
            }
        }

        return classes;
    };

    getAlertClasses = (useTheme: boolean) => {
        const { collapsed } = this.state;

        let classes = 'domain-bottom-alert panel-default';
        if (!collapsed) {
            if (useTheme) {
                classes += ' lk-border-theme-light';
            }
            else {
                classes += ' domain-bottom-alert-expanded';
            }
        }
        else {
            classes += ' panel-default';
        }

        if (!collapsed)
            classes += ' domain-bottom-alert-top';

        return classes;
    };

    render() {
        const context = {
            ...this.state,
            togglePanel: this.togglePanel,
            getPanelClass: this.getPanelClass,
            getAlertClasses: this.getAlertClasses
        };

        return (
            <DomainPropertiesPanelContextProvider value={context}>
                {this.props.children}
            </DomainPropertiesPanelContextProvider>
        )
    }
}
