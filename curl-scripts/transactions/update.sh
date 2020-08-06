#!/bin/bash

API="http://localhost:4741"
URL_PATH="/transactions"

curl "${API}${URL_PATH}/${ID}" \
  --include \
  --request PATCH \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer ${TOKEN}" \
  --data '{
  "transaction": {
    "name": "'"${NAME}"'",
    "transaction_type": "'"${TYPE}"'",
    "exchange": "'"${EXCHANGE}"'",
    "quantity": "'"${QTY}"'"  ,
    "date": "'"${DATE}"'" ,
    "price": "'"${PRICE}"'"
   }
  }'

echo
