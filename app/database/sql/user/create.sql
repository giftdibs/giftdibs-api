CREATE TABLE IF NOT EXISTS ${schema~}.user 
(
  id serial PRIMARY KEY,
  first_name varchar (20) NOT NULL,
  last_name varchar (20) NOT NULL,
  email_address varchar (50) NOT NULL,
  UNIQUE(email_address)
);
