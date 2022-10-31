import { RequiresPermission } from '../internal/components/base/Permissions';
import { PermissionTypes } from '@labkey/api';
import React, { FC } from 'react';
import { MenuItem } from 'react-bootstrap';
import classNames from 'classnames';
import { buildURL } from '../internal/url/AppURL';
import { AssayContextConsumer } from '../internal/components/assay/withAssayModels';

interface InMenuProps {
    asMenuItem?: boolean;
}

interface AssayMenuButtonProps extends InMenuProps {
    bsStyle?: string;
    url: string;
}

const AssayMenuButton: FC<AssayMenuButtonProps> = props => {
    if (props.asMenuItem) {
        return <MenuItem href={props.url}>{props.children}</MenuItem>;
    }

    return (
        <a
            href={props.url}
            className={classNames('btn', {
                'btn-default': !props.bsStyle,
                [`btn-${props.bsStyle}`]: props.bsStyle,
            })}
        >
            <span>{props.children}</span>
        </a>
    );
};

export const AssayExportDesignButton: FC<InMenuProps> = props => (
    <RequiresPermission perms={PermissionTypes.Read}>
        <AssayContextConsumer>
            {({ assayDefinition }) => (
                <AssayMenuButton
                    asMenuItem={props.asMenuItem}
                    url={buildURL(
                        'experiment',
                        'exportProtocols',
                        {
                            protocolId: assayDefinition.id,
                            xarFileName: assayDefinition.name + '.xar',
                        },
                        { container: assayDefinition.containerPath }
                    )}
                >
                    Export Assay Design
                </AssayMenuButton>
            )}
        </AssayContextConsumer>
    </RequiresPermission>
);
