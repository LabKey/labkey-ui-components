import React, { FC, memo, useCallback, useState } from 'react';
import { Dropdown, MenuItem, Modal } from 'react-bootstrap';

import { isLoading, isImage, LoadingSpinner, LoadingState } from '../..';
import { formatBytes } from '../util/utils';

const now = (): number => new Date().valueOf();

export interface IAttachment {
    created?: number;
    fileIcon?: string;
    iconFontCls: string;
    loadingState?: LoadingState;
    name: string;
    size?: number;
}

interface Props {
    noun?: string;
    attachment: IAttachment;
    imageURL?: string;
    imageCls?: string;
    allowRemove?: boolean;
    onDownload?: (attachment: IAttachment) => void;
    onRemove?: (attachment: IAttachment) => void;
}

export const AttachmentCard: FC<Props> = memo(props => {
    const { noun = 'attachment', allowRemove = true, attachment, imageURL, imageCls, onRemove, onDownload } = props;
    const [showModal, setShowModal] = useState<boolean>();

    const _showModal = useCallback(() => {
        setShowModal(true);
    }, [setShowModal]);

    const _hideModal = useCallback(() => {
        setShowModal(false);
    }, [setShowModal]);

    const _onDownload = useCallback((): void => {
        onDownload?.(attachment);
    }, [attachment, onDownload]);

    const _onRemove = useCallback(() => {
        if (allowRemove) {
            onRemove?.(attachment);
        }
    }, [allowRemove, attachment, onRemove]);

    if (!attachment) {
        return null;
    }

    const { iconFontCls, loadingState, name, size } = attachment;
    const isLoaded = !isLoading(loadingState);
    const recentlyCreated = attachment.created ? attachment.created > now() - 30000 : false;
    const _isImage = isImage(attachment.name);

    return (
        <>
            <div className="attachment-card" title={name}>
                <div
                    className="attachment-card__body"
                    onClick={isLoaded ? (_isImage ? _showModal : _onDownload) : undefined}
                >
                    <div className="attachment-card__icon">
                        {_isImage && !isLoaded && <LoadingSpinner msg="" />}
                        {_isImage && isLoaded && (
                            <img className={`attachment-card__icon_img ${imageCls}`} src={imageURL} alt={name} />
                        )}
                        {!_isImage && <i className={`attachment-card__icon_tile ${iconFontCls}`} />}
                    </div>
                    <div className="attachment-card__content">
                        <div className="attachment-card__name">{name}</div>
                        <div className="attachment-card__size">
                            {!isLoaded && <LoadingSpinner msg="Uploading..." />}
                            {isLoaded && recentlyCreated && (
                                <>
                                    <i className="fa fa-check-circle" /> File attached
                                </>
                            )}
                            {isLoaded && !recentlyCreated && size && formatBytes(size)}
                        </div>
                    </div>
                </div>
                {isLoaded && (
                    <Dropdown className="attachment-card__menu" componentClass="div" id="attachment-card__menu">
                        <Dropdown.Toggle useAnchor={true}>
                            <i className="fa fa-ellipsis-v" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="pull-right">
                            <MenuItem onClick={_onDownload}>Download</MenuItem>
                            {allowRemove && <MenuItem onClick={_onRemove}>Remove {noun}</MenuItem>}
                        </Dropdown.Menu>
                    </Dropdown>
                )}
            </div>

            <Modal bsSize="large" show={showModal} onHide={_hideModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <a onClick={_onDownload} style={{ cursor: 'pointer' }} title={'Download ' + noun}>
                            {name}
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
