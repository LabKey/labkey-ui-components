import React, { ChangeEventHandler, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { Progress } from '../base/Progress';

import { useServerContext } from '../base/ServerContext';
import { AppURL, createProductUrl } from '../../url/AppURL';
import { getCurrentAppProperties, getPrimaryAppProperties } from '../../app/utils';

import { resolveErrorMessage } from '../../util/messaging';

import { deleteContainerWithComment, getDeletionSummaries, Summary } from './actions';

interface CommentAreaProps {
    comment: string;
    onChangeComment: ChangeEventHandler<HTMLTextAreaElement>;
}
export const CommentArea: FC<CommentAreaProps> = memo(({ comment, onChangeComment }) => {
    return (
        <div className="delete-project-modal__comment">
            <p>
                <b>Deletion cannot be undone.</b> Do you want to proceed?{' '}
            </p>
            <p>
                <b>Reason for deleting</b>
            </p>
            <textarea
                className="form-control"
                placeholder="Enter comments (optional)"
                value={comment}
                rows={5}
                cols={50}
                onChange={onChangeComment}
            />
        </div>
    );
});

export const BodyEmpty: FC<CommentAreaProps> = memo(({ comment, onChangeComment }) => {
    return (
        <Modal.Body>
            <div className="delete-project-modal__text">
                <p>This project will be permanently deleted. It contains no data.</p>
            </div>

            <CommentArea comment={comment} onChangeComment={onChangeComment} />
        </Modal.Body>
    );
});

interface BodyProps {
    comment: string;
    onChangeComment: ChangeEventHandler<HTMLTextAreaElement>;
    summaries: Summary[];
}
export const Body: FC<BodyProps> = memo(({ summaries, comment, onChangeComment }) => {
    return (
        <Modal.Body>
            <div className="delete-project-modal__text">
                <p>This project and all of its data will be permanently deleted.</p>
                <p>
                    Before deleting this project, ensure there are no references to data (samples, sources or registry,
                    assay data, etc.) in other projects.
                </p>
            </div>

            <b> Project Data </b>

            <table className="table table-responsive table-condensed delete-project-modal__table ">
                <tbody>
                    {summaries ? (
                        summaries.map(s => (
                            <tr key={s.count + s.noun}>
                                <td>{s.noun}</td>
                                <td>{s.count}</td>
                            </tr>
                        ))
                    ) : (
                        <LoadingSpinner />
                    )}
                </tbody>
            </table>

            <CommentArea comment={comment} onChangeComment={onChangeComment} />
        </Modal.Body>
    );
});

interface BodyDeletingProps {
    totalCountFromSummaries: number;
}
export const BodyDeleting: FC<BodyDeletingProps> = memo(({ totalCountFromSummaries }) => {
    const [toggle, seToggle] = React.useState<boolean>(false);

    React.useEffect(() => {
        setTimeout(() => seToggle(true), 1);
    }, []);

    return (
        <Modal.Body>
            <div className="deleting-project-modal-text">Please don't close this page until deleting is done.</div>
            <Progress delay={0} estimate={totalCountFromSummaries * 15} toggle={toggle} />
        </Modal.Body>
    );
});

interface Props {
    onCancel: () => void;
    onError: (e: string) => void;
    projectName: string;
}

export const DeleteProjectModal: FC<Props> = memo(props => {
    const { projectName, onCancel, onError } = props;
    const [summaries, setSummaries] = useState<Summary[]>(undefined);
    const [comment, setComment] = useState<string>(undefined);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const { container, user } = useServerContext();

    useEffect(() => {
        (async () => {
            try {
                const allSummaries = await getDeletionSummaries();
                setSummaries(allSummaries);
            } catch (e) {
                // getDeletionSummaries() handles error logging
                // Purposely leave loading spinner indefinitely in case of summary retrieval failure
            }
        })();
    }, []);

    const onChangeComment = useCallback(e => {
        setComment(e.target.value);
    }, []);

    const onDeleteProject = useCallback(async () => {
        setIsDeleting(true);
        try {
            await deleteContainerWithComment(comment);

            const successMsg = `${projectName} successfully deleted.`;
            const adminProjectsHref = createProductUrl(
                getPrimaryAppProperties()?.productId,
                getCurrentAppProperties()?.productId,
                AppURL.create('admin', 'projects').addParam('successMsg', successMsg).toHref(),
                container.parentPath
            ).toString();

            const homeHref = createProductUrl(
                getPrimaryAppProperties()?.productId,
                getCurrentAppProperties()?.productId,
                AppURL.create('home').addParam('successMsg', successMsg).toHref(),
                container.parentPath
            ).toString();

            window.location.href = user.isAdmin ? adminProjectsHref : homeHref;
        } catch (e) {
            onError(resolveErrorMessage(e) ?? `${projectName} could not be deleted. Please try again.`);
        }
    }, [comment, container.parentPath, onError, projectName, user.isAdmin]);

    const totalCountFromSummaries = useMemo(
        () =>
            summaries?.reduce((prev, curr) => {
                return prev + curr.count;
            }, 0) ?? 0,
        [summaries]
    );

    const noData = useMemo(() => summaries?.length === 0, [summaries]);

    return (
        <Modal onHide={onCancel} show>
            <Modal.Header closeButton={!isDeleting}>
                <Modal.Title>{isDeleting ? 'Deleting project' : <> Permanently delete {projectName}? </>} </Modal.Title>
            </Modal.Header>

            {isDeleting ? (
                <BodyDeleting totalCountFromSummaries={totalCountFromSummaries} />
            ) : noData ? (
                <BodyEmpty onChangeComment={onChangeComment} comment={comment} />
            ) : (
                <Body comment={comment} onChangeComment={onChangeComment} summaries={summaries} />
            )}

            {!isDeleting && (
                <Modal.Footer>
                    <button className="btn btn-default pull-left" type="button" onClick={onCancel}>
                        Cancel
                    </button>

                    <button className="btn btn-danger" type="button" onClick={onDeleteProject} style={{}}>
                        Yes, Delete
                    </button>
                </Modal.Footer>
            )}
        </Modal>
    );
});
