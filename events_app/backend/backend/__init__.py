from .celery import app as celery_app
import pymysql


pymysql.version_info = (2, 2, 1, 'final', 0)
pymysql.install_as_MySQLdb()
# This ensures that Celery starts when Django starts
__all__ = ('celery_app',)
