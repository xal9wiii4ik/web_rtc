FROM python:3.9-alpine as builder

WORKDIR /usr/src

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apk update \
    && apk add gcc python3-dev musl-dev libffi-dev libevent-dev libc-dev make git openssl-dev libxml2-dev libxslt-dev libpq

RUN pip3 install --upgrade pip
COPY . .

RUN pip3 install -r requirements.txt
RUN pip install -U Twisted[tls,http2]
ENV DJANGO_SETTINGS_MODULE=django_web_rtc.settings
RUN export DJANGO_SETTINGS_MODULE