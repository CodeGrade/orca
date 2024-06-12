from enum import Enum
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import JSON, Date, ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Reservation(Base):
    __tablename__ = "Reservation"

    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(Date(), name="createdAt")
    release_at: Mapped[datetime] = mapped_column(Date(), name="releaseAt")

    job_id: Mapped[Optional[int]] = mapped_column(ForeignKey("Job.id"),
                                                  name="jobID")
    job: Mapped[Optional["Job"]] = relationship(uselist=False,
                                                foreign_keys=[job_id])
    submitter_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("Submitter.id"),
        name="submitterID"
    )
    submitter: Mapped[Optional["Submitter"]] = relationship(
        back_populates="reservations"
    )


class Job(Base):
    __tablename__ = "Job"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_url: Mapped[str] = mapped_column(String(), name="clientURL")
    client_key: Mapped[str] = mapped_column(String(), name="clientKey")
    config: Mapped[Dict[Any, Any]] = mapped_column(JSON())
    created_at: Mapped[datetime] = mapped_column(Date(), name="createdAt")

    submitter_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("Submitter.id"),
        name="submitterID"
    )
    submitter: Mapped[Optional["Submitter"]] = \
        relationship(back_populates="jobs", foreign_keys=[submitter_id])


class CollationType(str, Enum):
    USER = "USER"
    TEAM = "TEAM"


class Submitter(Base):
    __tablename__ = "Submitter"

    id: Mapped[int] = mapped_column(primary_key=True)
    collation_id: Mapped[str] = mapped_column(String(), name="collationID")
    collation_type: Mapped[CollationType] = mapped_column(name="collationType")
    client_url: Mapped[str] = mapped_column(String(), name="clientURL")

    jobs: Mapped[Optional[List["Job"]]] = relationship(
        back_populates="submitter")
    reservations: Mapped[Optional[List["Reservation"]]
                         ] = relationship(back_populates="submitter")
