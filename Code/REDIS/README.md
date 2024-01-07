Nodejs + MongoDB + Express + REDIS backend
---

How to run it via Docker:

1. Create a new network

```
docker network create taw
```


2. Start a MongoDB container 

```
docker run --network taw --name mymongo -d mongo:6
```

3. Start a REDIS container

```
docker run --network taw --name myredis -d redis
```

4. Open VSC and reopen this directory in container


5. Open the terminal and run

```
npm install
npm run compile
```

6. Run the application

```
node postmessages.js
```


Optional:
---

To inspect the database with mongo shell:

```
docker run -it --name mongodbshell --network taw --rm mongo:6 mongosh --host mymongo
```

Then, inside the shell:

```
use postmessage;
show collections;
```
