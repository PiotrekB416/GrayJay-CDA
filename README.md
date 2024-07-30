# Grayjay plugin for <span>cda.pl</span>

# Deployment instructions

## Pre-requisites

Open port 8080

### Nixos

run `nix develop` (requires flakes)

### Others

- install openssl
- install http server (I use python, but any will do)

## Deployment

1. Download the plugin
2. Replace contents of secret with your credentials
3. Run <span>deploy.sh</span>
4. Edit <span>CdaConfig.json</span> and change ip in sourceUrl to your ip
5. Run `python -m http.server 8080`
6. Generate a qr code of `grayjay://plugin/http://{ip}:8080/CdaConfig.json`
7. Scan it in grayjay


