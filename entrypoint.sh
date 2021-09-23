#!/bin/sh

if [ "$DATABASE" = "postgresql" ]
then
  echo "Waiting for psql"

  while ! nc -z $SQL_HOST $SQL_PORT; do
    sleep 0.1
  done
fi

exec "$@"