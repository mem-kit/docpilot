docker pull registry.cn-chengdu.aliyuncs.com/crjx/only_free:9.1.0.20limit.arm64


docker run --name=oa-pilot -i -t -d -p 80:80 --restart=always -e JWT_ENABLED=false registry.cn-chengdu.aliyuncs.com/crjx/only_free:9.1.0.20limit.arm64


service nginx status
service nginx stop



docker run --name=oa-pilot -i -t -d -p 7171:80 --restart=always -e JWT_ENABLED=false registry.cn-chengdu.aliyuncs.com/crjx/only_free:9.1.0.20limit.x86

docker exec oa-pilot /var/www/onlyoffice/documentserver/npm/json -f /etc/onlyoffice/documentserver/local.json 'services.CoAuthoring.secret.session.string'

lZ83z2Wdsk2EYWj2gz2BlXOUKVU8zyic


docker exec oa-pilot sudo supervisorctl start ds:example

docker exec oa-pilot sudo sed 's,autostart=false,autostart=true,' -i /etc/supervisor/conf.d/ds-example.conf

docker exec oa-pilot sudo supervisorctl start ds:adminpanel


docker exec oa-pilot sudo sed 's,autostart=false,autostart=true,' -i /etc/supervisor/conf.d/ds-adminpanel.conf


docker logs oa-pilot

StateStreet@2025!Hackathon

HH7T0ECZGQCT
