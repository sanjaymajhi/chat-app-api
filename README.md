# chat-app-api

This project consists of website that can be used to chat with people, post photos ,videos and so on in social feed.
This project is in progress.
Client side repo : https://github.com/sanjaymajhi/chat-app-client

# Below is an example nginx for deployment

```
server{
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name localhost;

    location / {
        root /home/ubuntu/chat-app-client/build;
        index index.html;
        try_files $uri /index.html;
    }

    location /users {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-NginX-Proxy true;

        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
    }
}
```
