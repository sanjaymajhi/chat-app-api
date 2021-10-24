# InstaChat

This app is made to connect anyone virtually with everyone around any corner of the world.

## Uses : 
1. Create profile
2. Follow others and other will follow you
3. Share photos, videos, youtube links
4. Home section to see posts of freinds and mutual friends
5. Trending section to see trending posts and videos
6. Search people around any corner of world
7. Like, comment, share in posts

## Technology Used (Back End) : 

1. NodeJS + ExpressJS
2. MongoDB Atlas + Mongoose ODM
3. Socket.io
4. Cloudinary
5. JSON Web Tokens
6. Google login and fb login

Client repo : https://github.com/sanjaymajhi/chat-app-client

## Env File : 
create .env file in the root directory and put this :
```
MONGODB_URI=<generate from mongodb atlas website>

CLOUD_NAME=<generate from cloudinary>
API_KEY=<generate from cloudinary>
API_SECRET=<generate from cloudinary>
```

## How to use : 
1. clone this repo
2. clone the API repo
3. Make .env files in both directories
4. do npm install in both directories
5. Now in bash, type npm run start-both (in backend folder bash)

# Project Deployed in Heroku PaaS

Website : http://chat-app-by-sanjay.herokuapp.com/login
Demo Video : https://www.linkedin.com/feed/update/urn:li:activity:6676831891921915904/


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
