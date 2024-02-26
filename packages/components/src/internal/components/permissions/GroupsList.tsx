import React, { FC, memo, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { AppURL, createProductUrlFromParts } from '../../url/AppURL';
import { fetchGroupMembership } from '../administration/actions';
import { useAppContext } from '../../AppContext';
import { useServerContext } from '../base/ServerContext';
import { Groups, MemberType } from '../administration/models';
import { getAppHomeFolderPath, getCurrentAppProperties, getPrimaryAppProperties } from '../../app/utils';
import { useContainerUser } from '../container/actions';

interface Props {
    asRow?: boolean;
    groups: Array<{ displayValue: string; value: number }>;
    showLinks?: boolean;
}

export const GroupsList: FC<Props> = memo(props => {
    const { groups, asRow = true, showLinks = true } = props;
    const [groupMembership, setGroupMembership] = useState<Groups>();
    const { api } = useAppContext();
    const { container, moduleContext } = useServerContext();
    const homeFolderPath = getAppHomeFolderPath(container, moduleContext);
    const homeContainer = useContainerUser(homeFolderPath);
    const currentProductId = getCurrentAppProperties()?.productId;
    const targetProductId = getPrimaryAppProperties()?.productId;

    useEffect(() => {
        (async () => {
            if (homeContainer.isLoaded && homeContainer.user.hasAdminPermission()) {
                const groupMembership_ = await fetchGroupMembership(homeContainer.container, api.security);
                setGroupMembership(groupMembership_);
            }
        })();
    }, [api.security, homeContainer.isLoaded]);

    if (!groups) return null;

    const body = (
        <ul className="principal-detail-ul">
            {groups.length > 0 ? (
                groups.map(group => {
                    const url = createProductUrlFromParts(
                        targetProductId,
                        currentProductId,
                        { expand: group.value },
                        'admin',
                        'groups'
                    );

                    return (
                        <li key={group.value} className="principal-detail-li">
                            {homeContainer.user?.isAdmin &&
                            showLinks &&
                            groupMembership?.[group.value].type !== MemberType.siteGroup ? (
                                <a href={url instanceof AppURL ? url.toHref() : url}>{group.displayValue}</a>
                            ) : (
                                group.displayValue
                            )}
                        </li>
                    );
                })
            ) : (
                <li className="principal-detail-li">None</li>
            )}
        </ul>
    );

    if (!asRow) return body;

    return (
        <>
            <hr className="principal-hr" />
            <Row>
                <Col xs={4} className="principal-detail-label">
                    Groups
                </Col>
                <Col xs={8} className="principal-detail-value">
                    {body}
                </Col>
            </Row>
        </>
    );
});
