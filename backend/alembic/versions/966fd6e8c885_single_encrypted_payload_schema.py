"""single_encrypted_payload_schema

Revision ID: 966fd6e8c885
Revises: a11f89f8a5c0
Create Date: 2026-09-20 14:40:30.083180

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '966fd6e8c885'
down_revision: Union[str, None] = 'a11f89f8a5c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('vault_items', schema=None) as batch_op:
        batch_op.add_column(sa.Column('encrypted_payload', sa.Text(), nullable=False))
        batch_op.drop_column('title_encrypted')
        batch_op.drop_column('payload_encrypted')


def downgrade() -> None:
    with op.batch_alter_table('vault_items', schema=None) as batch_op:
        batch_op.add_column(sa.Column('payload_encrypted', sa.Text(), nullable=False))
        batch_op.add_column(sa.Column('title_encrypted', sa.Text(), nullable=False))
        batch_op.drop_column('encrypted_payload')
