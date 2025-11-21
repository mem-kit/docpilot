docker run -i -t -d -p 80:80 --restart=always -e JWT_ENABLED=false onlyoffice/documentserver:latest


docker exec 86dd74a2ef98 sudo supervisorctl start ds:example

docker exec 86dd74a2ef98 sudo sed 's,autostart=false,autostart=true,' -i /etc/supervisor/conf.d/ds-example.conf


docker exec 86dd74a2ef98 sudo supervisorctl start ds:adminpanel

docker exec 86dd74a2ef98 sudo sed 's,autostart=false,autostart=true,' -i /etc/supervisor/conf.d/ds-adminpanel.conf


 Bootstrap code: 53Q8MK2LBJ0G


 http://localhost/admin/example

https://api.onlyoffice.com/docs/office-api/get-started/playground/


 docker run -i -t -d -p 80:80 --restart=always -e JWT_ENABLED=false onlyoffice/documentserver-de

 docker exec 767285bd5b5e sudo supervisorctl start ds:example

docker exec 767285bd5b5e sudo sed 's,autostart=false,autostart=true,' -i /etc/supervisor/conf.d/ds-example.conf

docker exec 767285bd5b5e sudo supervisorctl start ds:adminpanel

docker exec 767285bd5b5e sudo sed 's,autostart=false,autostart=true,' -i /etc/supervisor/conf.d/ds-adminpanel.conf

Bootstrap code: U0DPKA339FT1

http://localhost/web-apps/apps/api/documents/api.js


