$ErrorActionPreference = 'Stop'

php -d extension=fileinfo -d extension=pdo_sqlite -S 127.0.0.1:8001 -t public
