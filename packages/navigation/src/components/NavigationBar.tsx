import * as React from 'reactn'

interface IconLink {
    iconUrl: string
    targetUrl: string
}

interface NavigationBarProps {
    appLogo: IconLink,
    productId: string,
    showSearchBox: boolean,
    showUserMenu: boolean
}

export class NavigationBar extends React.Component<NavigationBarProps, any> {
    static defaultProps: {
        showSearchBox: false,
        showUserMenu: false
    };

    render() {
        const { appLogo, productId, showSearchBox, showUserMenu } = this.props;

        const logo = appLogo ? <a href={appLogo.targetUrl}><img src={appLogo.iconUrl}/></a> : null;
        return (
            <div>
            </div>
        )
    }
}