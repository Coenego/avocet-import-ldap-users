#!/bin/bash

# Verify that ldapsearch is installed
which ldapsearch > /dev/null 2>&1 || { echo >&2 "Importing aborted: ldapsearch not installed"; exit 1; }
which node > /dev/null 2>&1 || { echo >&2 "Importing aborted: Node.js not installed"; exit 2; }

# Install the Node.js dependencies
npm install -d

# Create a temporary file where the users will be stored
TMPFILE="/tmp/$(basename $0).$$.tmp"

# Perform an LDAP search
ldapsearch -x -LLL -H ldaps://ldap.lookup.cam.ac.uk -b "ou=people,o=University of Cambridge,dc=cam,dc=ac,dc=uk" "(uid=aa1*)" uid cn mail >> $TMPFILE

# Remove the previous users.csv file, if any
if [ -f ./users.csv ]
then
    rm ./users.csv
fi

# Start the Node process
node ./import.js -f $TMPFILE | bunyan

# Start importing users into Hilary
if [ -f ./users.csv ]
then
    USERSFILE="./users.csv";
else
    echo >&2 "Users.csv not found";
    exit 3;
fi
