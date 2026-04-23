# settings.py


from datetime import timedelta
from dotenv import load_dotenv
from pathlib import Path

import dj_database_url, os, ssl


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / '.env') # This looks for a .env file at the root directory & loads it into os.environ

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',') # Allows any different host to host our Django app
# ALLOWED_HOSTS = ['*']

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES' : (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES' : (
        # 'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES' : [
        'rest_framework.throttling.ScopedRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES' : {
        'ticket_checkout' : '5/min'
    },
    'DEFAULT_PAGINATION_CLASS' : 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE' : 10,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME' : timedelta(minutes = 15),
    'REFRESH_TOKEN_LIFETIME' : timedelta(days = 30),
    'ROTATE_AFTER_REFRESH' : True,
    'BLACKLIST_AFTER_ROTATION' : True
}

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'cloudinary',
    'cloudinary_storage',
    'api',
    'rest_framework',
    'corsheaders',
]

CLOUDINARY_STORAGE = {
    'CLOUD_NAME' : os.environ.get('CLOUDINARY_CLOUD_NAME'),
    'API_KEY' : os.environ.get('CLOUDINARY_API_KEY'),
    'API_SECRET' : os.environ.get('CLOUDINARY_API_SECRET')
}

STORAGES = {
    'default' : {
        'BACKEND' : 'cloudinary_storage.storage.MediaCloudinaryStorage',
    },
    'staticfiles' : {
        'BACKEND' : 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': dj_database_url.parse(
        os.getenv('DATABASE_URL'),
        conn_max_age = 600,
        conn_health_checks = True
    )
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Kolkata'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

FRONTEND_URL = os.getenv('FRONTEND_URL')
CORS_ALLOW_ALL_ORIGINS = os.getenv('DEBUG') == 'True'
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',')

AUTH_USER_MODEL = 'api.CustomUser'

MEDIA_URL = '/media/' # URL path for browser
MEDIA_ROOT = os.path.join(BASE_DIR, 'media') # Absolute path on server's filesystem

TICKET_SIGNING_KEY = os.getenv('TICKET_SIGNING_KEY')

if not TICKET_SIGNING_KEY:

    raise ValueError("Missing TICKET_SIGNING_KEY in .env file")

# CELERY SETTINGS
CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_TIMEZONE = 'UTC'

if CELERY_BROKER_URL.startswith('rediss://'):
    CELERY_BROKER_USE_SSL = {'ssl_cert_reqs' : ssl.CERT_NONE}
    CELERY_REDIS_BACKEND_USE_SSL = {'ssl_cert_reqs' : ssl.CERT_NONE}

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend' # For development, emails will be printed to console
EMAIL_HOST = 'smtp.zoho.in'
EMAIL_PORT = 465
EMAIL_USE_TLS = False # TLS (Transport Layer Security): Ensures encryption when sent over the internet
EMAIL_USE_SSL = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = "PLUG. <tickets@pluglive.in>"

# BREVO_API_KEY = os.getenv('BREVO_API_KEY')
# BREVO_FROM_EMAIL = os.getenv('BREVO_FROM_EMAIL')
# BREVO_FROM_NAME = os.getenv('BREVO_FROM_NAME')

SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True').lower() == 'true'
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'True').lower() == 'true'
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'True').lower() == 'true'

if SECURE_SSL_REDIRECT:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_HSTS_SECONDS = 31536000 # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')
RAZORPAY_WEBHOOK_SECRET = os.getenv('RAZORPAY_WEBHOOK_SECRET')

LOGGING = {
    'version' : 1,
    'disable_existing_loggers' : False,
    'formatters' : {
        'verbose' : {
            'format' : '{levelname} {asctime} {module} {message}',
            'style' : '{',
        }
    },
    'handlers' : {
        'console' : {
            'class' : 'logging.StreamHandler',
            'formatter' : 'verbose',
        }
    },
    'root' : {
        'handlers' : ['console'],
        'level' : 'WARNING',
    },
    'loggers' : {
        'django' : {
            'handlers' : ['console'],
            'level' : 'INFO',
            'propagate' : False,
        }
    }
}
