import React, { FC, memo, useCallback, useState } from 'react';
import { Dropdown, MenuItem, Modal } from 'react-bootstrap';

import {formatBytes, getIconFontCls, isImage} from '../util/utils';
import { isLoading, LoadingState } from '../../public/LoadingState';
import { LoadingSpinner } from '../components/base/LoadingSpinner';

const now = (): number => new Date().valueOf();

export interface IAttachment {
    created?: number;
    description?: string;
    fileIcon?: string;
    iconFontCls?: string;
    loadingState?: LoadingState;
    name: string;
    size?: number;
    title?: string;
}

interface Props {
    allowDownload?: boolean;
    allowRemove?: boolean;
    attachment: IAttachment;
    copyNoun?: string;
    imageCls?: string;
    imageURL?: string;
    noun?: string;
    onCopyLink?: (attachment: IAttachment) => void;
    onDownload?: (attachment: IAttachment) => void;
    onRemove?: (attachment: IAttachment) => void;
    outerCls?: string;
}

export const AttachmentCard: FC<Props> = memo(props => {
    const {
        attachment,
        imageURL,
        imageCls,
        onCopyLink,
        onRemove,
        onDownload,
        outerCls = '',
        noun = 'attachment',
        copyNoun = 'link',
        allowRemove = true,
        allowDownload = true,
    } = props;
    const [showModal, setShowModal] = useState<boolean>();

    const _showModal = useCallback(() => {
        setShowModal(true);
    }, [setShowModal]);

    const _hideModal = useCallback(() => {
        setShowModal(false);
    }, [setShowModal]);

    const _onCopyLink = useCallback((): void => onCopyLink(attachment), [attachment, onCopyLink]);

    const _onDownload = useCallback((): void => {
        if (allowDownload) {
            onDownload?.(attachment);
        }
    }, [allowDownload, attachment, onDownload]);

    const _onRemove = useCallback(() => {
        if (allowRemove) {
            onRemove?.(attachment);
        }
    }, [allowRemove, attachment, onRemove]);

    if (!attachment) {
        return null;
    }

    const { iconFontCls, loadingState, name, title, size, description } = attachment;
    const _iconFontCls = iconFontCls ?? getIconFontCls(name);
    const isLoaded = !isLoading(loadingState);
    const recentlyCreated = attachment.created ? attachment.created > now() - 30000 : false;
    const _isImage = isImage(attachment.name);

    return (
        <>
            <div className={'attachment-card ' + outerCls} title={name}>
                <div
                    className="attachment-card__body"
                    onClick={isLoaded ? (_isImage ? _showModal : _onDownload) : undefined}
                >
                    <div className="attachment-card__icon">
                        {_isImage && !isLoaded && <LoadingSpinner msg="" />}
                        {_isImage && isLoaded && (
                            <img className={`attachment-card__icon_img ${imageCls}`} src={imageURL} alt={name} />
                        )}
                        {!_isImage && <i className={`attachment-card__icon_tile ${_iconFontCls}`} />}
                    </div>
                    <div className="attachment-card__content">
                        <div className="attachment-card__name">{title ?? name}</div>
                        <div className="attachment-card__size">
                            {!isLoaded && <LoadingSpinner msg="Uploading..." />}
                            {isLoaded && recentlyCreated && (
                                <>
                                    <i className="fa fa-check-circle" /> File attached
                                </>
                            )}
                            {isLoaded && !recentlyCreated && size && formatBytes(size)}
                        </div>
                        {description && <div className="attachment-card__description">{description}</div>}
                    </div>
                </div>
                {isLoaded && (
                    <Dropdown className="attachment-card__menu" componentClass="div" id="attachment-card__menu">
                        <Dropdown.Toggle useAnchor={true}>
                            <i className="fa fa-ellipsis-v" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="pull-right">
                            {onCopyLink && <MenuItem onClick={_onCopyLink}>Copy {copyNoun}</MenuItem>}
                            {allowDownload && <MenuItem onClick={_onDownload}>Download</MenuItem>}
                            {allowRemove && <MenuItem onClick={_onRemove}>Remove {noun}</MenuItem>}
                        </Dropdown.Menu>
                    </Dropdown>
                )}
            </div>

            <Modal bsSize="large" show={showModal} onHide={_hideModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <a onClick={_onDownload} className="clickable" title={'Download ' + noun}>
                            {title ?? name}
                        </a>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <img src={imageURL} alt={`${name} image`} title={name} className="attachment-card__img_modal" />
                </Modal.Body>
            </Modal>
        </>
    );
});
