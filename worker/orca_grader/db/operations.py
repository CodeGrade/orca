from typing import Optional, Set, Any, Dict
from sqlalchemy import create_engine, select, delete, func, \
    insert
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from orca_grader.config import APP_CONFIG
from orca_grader.common.types.grading_job_json_types import GradingJobJSON
from orca_grader.db.models import Submitter, Reservation, Job

__ENGINE = create_engine(APP_CONFIG.postgres_url)


def get_next_job() -> Optional[GradingJobJSON]:
    with Session(__ENGINE) as session, session.begin():
        next_reservation = session.scalar(
            select(Reservation).order_by(
                Reservation.release_at.desc()
            ).limit(1)
        )
        if not next_reservation:
            return None
        if next_reservation.job is not None:
            next_job = next_reservation.job
        else:
            next_job = session.scalar(
                select(Job)
                .where(Job.submitter_id == next_reservation.submitter_id)
                .order_by(Job.created_at.desc())
                .limit(1)
            )
        __clean_up_queue_info(session, next_reservation, next_job)
        return __create_grading_job_json(next_reservation, next_job)


def __create_grading_job_json(reservation: Reservation, job: Job)\
        -> GradingJobJSON:
    return {
        'queue_id': job.id,
        'release_at': reservation.release_at,
        'created_at': job.created_at,
        **job.config
    }


def __clean_up_queue_info(session: Session,
                          reservation: Reservation,
                          job: Job):
    session.execute(
        delete(Reservation).where(Reservation.id == reservation.id)
    )
    if job.submitter_id is not None:
        __clean_up_submitter(session, job.submitter_id)
    session.execute(
        delete(Job).where(Job.id == job.id)
    )


def reenqueue_job(grading_job: GradingJobJSON):
    with Session(__ENGINE) as session, session.begin():
        more_recent_job_exists = session.query(func.count(Job.id))\
            .where(Job.client_key == grading_job["key"])\
            .where(Job.client_url == grading_job["response_url"])\
            .scalar() > 0
        if more_recent_job_exists:
            more_recent_job = __get_more_recent_job(
                session, grading_job["key"],
                grading_job["client_url"]
            )
            __delete_more_recent_job_queue_info(session, more_recent_job)
            __create_immediate_job(session, {**grading_job,
                                             **more_recent_job.config})
        else:
            __create_immediate_job(session, grading_job)


def __create_immediate_job(session: Session, grading_job: GradingJobJSON):
    job_config = __omit(grading_job,
                        set(['queue_id', 'release_at', 'created_at']))
    inserted_job_id = session.execute(
        insert(Job)
        .values(config=job_config,
                client_key=grading_job["key"],
                client_url=grading_job["response_url"]
                )
        .returning(Job.id)
    ).scalar()
    session.execute(
        insert(Reservation)
        .values(job_id=inserted_job_id, release_at=grading_job["release_at"])
    )


def __omit(d: Dict[str, Any], keys: Set[str]) -> Dict[str, Any]:
    result = dict()
    for k, v in d.items():
        if k not in keys:
            result[k] = v
    return result


def __get_more_recent_job(session: Session, client_key: str,
                          client_url: str) -> Job:
    more_recent_job = session.scalar(
        select(Job)
        .where(Job.client_key == client_key)
        .where(Job.client_url == client_url)
    )
    return more_recent_job


def __delete_more_recent_job_queue_info(session: Session, more_recent_job: Job) -> None:
    __delete_associated_reservation(session, more_recent_job)
    if more_recent_job.submitter_id is not None:
        __clean_up_submitter(session, more_recent_job.submitter_id)
    session.execute(delete(Job).where(Job.id == more_recent_job.id))


def __clean_up_submitter(session: Session, submitter_id: int):
    num_jobs_for_submitter = session.query(func.count(Job.id))\
        .where(Job.submitter_id == submitter_id)\
        .scalar()
    # NOTE: this function is always called when a submitter only has one job
    # -- the one that is about to be removed from the queue.
    if num_jobs_for_submitter == 1:
        session.execute(delete(Submitter).where(Submitter.id == submitter_id))


def __delete_associated_reservation(session: Session, associated_job: Job) -> None:
    if associated_job.reservation_id is not None:
        session.execute(
            delete(Reservation).where(
                Reservation.id == associated_job.reservation_id
            )
        )
        return
    reservation = __get_associated_reservation(session, associated_job)
    session.execute(delete(Reservation).where(
        Reservation.id == reservation.id
    ))


def __get_associated_reservation(session: Session, associated_job: Job) -> Reservation:
    row_number_query = text(
        """
        SELECT row_number() OVER (ORDER BY t."createdAt" DESC) as "rowNumber"
        FROM (
          SELECT *
          FROM "Job" j
          WHERE j."submitterID" = {0}
        ) t
        WHERE t."clientKey" = '{1}' AND t."clientURL" = '{2}'
        ORDER BY t."createdAt" DESC;
        """.format(associated_job.submitter_id, associated_job.client_key,
                   associated_job.client_url)
    )
    row_number = session.execute(row_number_query).scalar()
    return session.query(Reservation)\
        .where(Reservation.submitter_id == associated_job.submitter_id)\
        .offset(row_number - 1).limit(1).first()
