# GiftDibs.com API

## Create Database:
```
bash$ postgres -D /usr/local/var/postgres
bash$ createuser --pwprompt <user>
bash$ createdb -O <user> -E utf8 <db>
bash$ psql -U <user> -W <db>
```

## Stop Database:
```
bash$ \q
```

## Start server:
```
bash$ npm start
```