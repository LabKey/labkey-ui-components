import React, { PureComponent, ComponentType } from 'react';

export interface InjectedDomainPropertiesPanelCollapseProps {
    collapsed: boolean;
    collapsible?: boolean;
    controlledCollapse: boolean;
    togglePanel: (collapsed?: boolean) => void;
}

export interface MakeDomainPropertiesPanelCollapseProps {
    collapsible?: boolean;
    controlledCollapse: boolean;
    initCollapsed: boolean;
    onToggle?: (collapsed: boolean, callback: () => any) => void;
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
                collapsed: props.initCollapsed,
            };
        }

        componentDidUpdate(prevProps: Props & MakeDomainPropertiesPanelCollapseProps): void {
            const { controlledCollapse, initCollapsed } = this.props;

            // if controlled collapse, allow the prop change to update the collapsed state
            if (controlledCollapse && prevProps.initCollapsed !== initCollapsed) {
                this.toggleLocalPanel(initCollapsed);
            }
        }

        toggleLocalPanel = (collapsed?: boolean): void => {
            this.setState(state => ({
                collapsed: collapsed !== undefined ? collapsed : !state.collapsed,
            }));
        };

        togglePanel = (evt: any, collapsed?: boolean): void => {
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
