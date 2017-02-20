# GiftDibs.com API

## Create database:
```
bash$ postgres -D /usr/local/var/postgres
createuser --pwprompt <user>
createdb -O <user> -E utf8 <db>
psql -U <user> -W <db>
CREATE SCHEMA <yourschema>;
```

## Stop PostgreSQL CLI:
```
\q
```

## Start server:
```
npm start
```

## Run database setup:
```
npm run db:drop # clears all records!
npm run db:setup
```