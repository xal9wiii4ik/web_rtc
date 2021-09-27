FROM python:3.9-alpine as builder

WORKDIR /usr/src

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apk update \
    && apk add gcc python3-dev musl-dev libffi-dev libevent-dev libc-dev make git openssl-dev libxml2-dev libxslt-dev

RUN pip3 install --upgrade pip
COPY . .

COPY ./requirements.txt .
RUN pip3 install -r requirements.txt
RUN pip3 wheel --no-cache-dir --no-deps --wheel-dir /usr/src/web_rtc/wheels -r requirements.txt

# FINAL

FROM python:3.8.3-alpine

RUN mkdir -p /home

RUN addgroup -S group && adduser -S user -G group

ENV HOME=/home
ENV APP_HOME=/home/web
RUN mkdir $APP_HOME
RUN mkdir $APP_HOME/staticfiles
RUN mkdir $APP_HOME/mediafiles
RUN mkdir /run/daphne/
WORKDIR $APP_HOME

RUN apk update && apk add gcc libpq musl-dev libffi-dev
COPY --from=builder /usr/src/web_rtc/wheels /wheels
COPY --from=builder /usr/src/requirements.txt .
RUN pip3 install --upgrade pip
#RUN pip3 install -r requirements.txt
RUN pip3 install --no-cache /wheels/*

COPY ./entrypoint.sh $APP_HOME

COPY . $APP_HOME

RUN chown -R user:group $APP_HOME
RUN chown -R user:group /run/daphne/

USER user
RUN python manage.py migrate # Can this be done during build? i.e. no link to the DB?
RUN set DJANGO_SETTINGS_MODULE="django_web_rtc.settings"
ENTRYPOINT ["/home/web/entrypoint.sh"]

#FROM python:3.9-alpine
#ENV PYTHONDONTWRITEBYTECODE 1
#ENV PYTHONUNBUFFERED 1
#RUN apk update \
#    && apk add gcc python3-dev musl-dev libffi-dev libevent-dev libc-dev make git openssl-dev libxml2-dev libxslt-dev
#
#WORKDIR /usr/src
#ENV HOME=/home
#ENV APP_HOME=/home/web
#COPY ./requirements.txt .
#RUN pip3 install --upgrade pip
#RUN mkdir $APP_HOME
#RUN mkdir $APP_HOME/staticfiles
#RUN mkdir $APP_HOME/mediafiles
#RUN pip install -r requirements.txt
#COPY . $APP_HOME
#
#RUN chown -R user:group $APP_HOME
#
#USER user
#ENTRYPOINT ["/home/web/entrypoint.sh"]
