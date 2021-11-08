##Create the ssl certificate and key to be used by the vault, ref: https://dev.to/techschoolguru/how-to-create-sign-ssl-tls-certificates-2aai
# 1. Generate CA's private key and self-signed certificate
openssl req -x509 -newkey rsa:4096 -days 365 -nodes -keyout ca-key.pem -out ca-cert.pem -subj "/C=FR/ST=Occitanie/L=Toulouse/O=Tech School/OU=Education/CN=*.techschool.guru/emailAddress=techschool.guru@gmail.com"

echo "CA's self-signed certificate"
openssl x509 -in ca-cert.pem -noout -text

# 2. Generate web server's private key and certificate signing request (CSR)
openssl req -newkey rsa:4096 -nodes -keyout server-key.pem -out server-req.pem -subj "/C=FR/ST=Ile de France/L=Paris/O=PC Book/OU=Computer/CN=*.pcbook.com/emailAddress=pcbook@gmail.com"

# 3. Use CA's private key to sign web server's CSR and get back the signed certificate, the cert-ext-file.cnf is in the hashicorp-vault folder contains the IPs that apply to the certificate
openssl x509 -req -in server-req.pem -days 365 -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -out server-cert.pem -extfile cert-ext-file.cnf

# 4. Concatenate server and CA certificates
cp server-cert.pem server-and-ca-certificate.pem
cat ca-cert.pem >> server-and-ca-certificate.pem

# 5. Copy server-cert.pem server-and-ca-certificate.pem and ca-cert.pem to ~/hashicorp-vault/certs, make sure to create dir first
cp server-cert.pem server-and-ca-certificate.pem and ca-cert.pem ~/hashicorp-vault/certs

# 6. Make certs readable to all
sudo chmod 777 ~/hashicorp-vault/certs/*

#Create and run vault container, make sure to create the corresponding dirs for the volumes, and place the configuration file in the config dir
docker run --cap-add=IPC_LOCK --name=prod-vault  -p 8200:8200 -v ~/hashicorp-vault/config:/vault/config -v ~/hashicorp-vault/logs:/vault/logs -v ~/hashicorp-vault/file:/vault/file -v ~/hashicorp-vault/certs:/vault/certs vault server

#Connect to container
docker exec -it prod-vault /bin/sh

#Copy ca-cert.pem to system certs, so that the certificate is recognized as valid by the cli
cp /vault/certs/ca-cert.pem /etc/ssl/certs/hashicorp-vault-ca-cert.pem

#When first started the vault is uninitialized and unsealed
#To initialize run the following command, this will display the root token and unsealkeys
vault operator init

#To unseal run the following command, this has to be run as many types as the unseal threshold(3) with a different unseal key
vault operator unseal

#Once unsealed, set the token environment variable equal to the root token to be used as authentication
export VAULT_TOKEN=<ROOT TOKEN>

#Enable app role, the auth that will be used for the hppl-ingestion app to authenticate
vault auth enable approle

#Enable a v1 secrets kv engine at path secret-v1 to store the hppl-app secrets
vault secrets enable -version=1 -path=secret-v1 kv

#Create the policy to be used by the hppl ingestion app
vault policy write hppl-app-read /vault/logs/hppl-app-policy.hcl

#Create appRole for the hppl ingestion app
vault write auth/approle/role/hppl-app-role token_ttl=10h token_max_ttl=24h token_policies=hppl-app-read

#Get hppl appRole roleId, must be specified in the hppl app config file vault.roleId
vault read auth/approle/role/hppl-app-role/role-id

#Get hppl appRole secretId, must be specified in the hppl app config file vault.secretId
vault write -f auth/approle/role/hppl-app-role/secret-id

#Create secret for cohesity credentials
vault kv put secret-v1/data/hppl/cohesity user="user" password="password" domain="LOCAL"

#Create secret for contract keys
vault kv put secret-v1/data/hppl/contract keys="5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3,5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD2"


openssl req -x509 -newkey rsa:4096 -days 365 -nodes -keyout ca-key.pem -out ca-cert.pem -subj "/CN=*.hppl.ca"

openssl req -newkey rsa:4096 -nodes -keyout server-key.pem -out server-req.pem -subj "/CN=*.hppl.server"

openssl x509 -req -in server-req.pem -days 365 -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -out server-cert.pem -extfile cert-ext-file.cnf