#!/bin/sh
set -eu

psql --set ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  --set api_user="$API_DB_USER" --set api_password="$API_DB_PASSWORD" \
  --set owner="$POSTGRES_USER" --set database="$POSTGRES_DB" <<'SQL'
CREATE ROLE :"api_user" LOGIN PASSWORD :'api_password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
GRANT CONNECT ON DATABASE :"database" TO :"api_user";
GRANT USAGE ON SCHEMA public TO :"api_user";
ALTER DEFAULT PRIVILEGES FOR ROLE :"owner" IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"api_user";
SQL
