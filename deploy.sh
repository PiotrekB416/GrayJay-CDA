#!/bin/sh

rm DeployedCdaScript.js

file_contents=$(cat secret | sed 's/ /\n/g')
file_contents=($file_contents)
cp CdaScript.js DeployedCdaScript.js

sed -i -e "s/{{login}}/${file_contents[0]}/g" DeployedCdaScript.js

password="$(echo -n "${file_contents[1]}" | md5sum | sed 's/  -//g')"

password="$(echo -n "$password" | openssl dgst -hmac 'NpmMLBWRgtEX8vp3Kf3d0tasBpFt0tuGswL9hR0qt7bQdaxuvDGoczFGeqd68Nj2' -binary | openssl enc -base64)"

password="$(echo -n "$password" | sed 's/=//g')"

sed -i -e "s/{{password}}/$password/g" DeployedCdaScript.js
