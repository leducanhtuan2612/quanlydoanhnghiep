"""update employee table

Revision ID: 10e7a7972b67
Revises: 1ac4e5cd1ee6
Create Date: 2025-11-14 00:25:58.401558

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '10e7a7972b67'
down_revision: Union[str, Sequence[str], None] = '1ac4e5cd1ee6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
