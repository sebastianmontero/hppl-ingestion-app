# **Notes**

- start-ingestion-app is a helper script to run the application in docker containers
- Before running the app in docker containers make sure to properly configure the .env configuration file, and setting up the mapped dirs for the vault config, the hppl ingestion app config and logs, the config dir for the app can be used for the configuration file and to place the job configs file to load
- When running the app inside containers, be mindful that the paths in the configuration files should be paths inside the container(container.hjson is an example file), also the hosts are container sensitive, the service name can be used as host