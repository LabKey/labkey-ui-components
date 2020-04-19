import React, { PureComponent, ComponentType } from 'react';

export interface InjectedDomainPropertiesPanelCollapseProps {
    controlledCollapse: boolean;
    collapsible?: boolean;
    collapsed: boolean;
    togglePanel: (evt: any, collapsed?: boolean) => void;
}

export interface MakeDomainPropertiesPanelCollapseProps {
    controlledCollapse: boolean;
    collapsible?: boolean;
    initCollapsed: boolean;
    onToggle?: (collapsed: boolean, callback: () => any) => any;
}

interface State {
    collapsed: boolean;
}

export function withDomainPropertiesPanelCollapse<Props>(
    ComponentToWrap: ComponentType<Props & InjectedDomainPropertiesPanelCollapseProps>
): ComponentType<Props & MakeDomainPropertiesPanelCollapseProps> {
    class ComponentWithDomainPropertiesPanelCollapse extends PureComponent<
        Props & MakeDomainPropertiesPanelCollapseProps,
        State
    > {
        constructor(props: Props & MakeDomainPropertiesPanelCollapseProps) {
            super(props);

            this.state = {
                collapsed: false,
            };
        }

        componentWillReceiveProps(nextProps: Readonly<Props & MakeDomainPropertiesPanelCollapseProps>): void {
            const { controlledCollapse, initCollapsed } = this.props;

            // if controlled collapse, allow the prop change to update the collapsed state
            if (controlledCollapse && nextProps.initCollapsed !== initCollapsed) {
                this.toggleLocalPanel(nextProps.initCollapsed);
            }
        }

        toggleLocalPanel = (collapsed?: boolean) => {
            this.setState(state => ({
                collapsed: collapsed !== undefined ? collapsed : !state.collapsed,
            }));
        };

        togglePanel = (evt: any, collapsed?: boolean) => {
            const { onToggle, collapsible, controlledCollapse } = this.props;

            if (collapsible || controlledCollapse) {
                if (onToggle) {
                    onToggle(collapsed !== undefined ? collapsed : !this.state.collapsed, this.toggleLocalPanel);
                } else {
                    this.toggleLocalPanel(collapsed);
                }
            }
        };

        render() {
            // pull out MakeDomainPropertiesPanelCollapseProps as we don't want to pass that to children
            const { initCollapsed, onToggle, controlledCollapse, collapsible, ...props } = this.props;
            const { collapsed } = this.state;

            return (
                <ComponentToWrap
                    controlledCollapse={controlledCollapse}
                    collapsible={collapsible}
                    collapsed={collapsed}
                    togglePanel={this.togglePanel}
                    {...(props as Props)}
                />
            );
        }
    }

    return ComponentWithDomainPropertiesPanelCollapse;
}
